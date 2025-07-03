from fastapi import FastAPI, Request
from pydantic import BaseModel
# from langchain_community.chat_models import ChatOllama
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, ToolMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Dict, Any, Optional, Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END
from langchain_community.tools import DuckDuckGoSearchRun
import operator
import json
import uuid
import uvicorn
import os

# --- Tool Function ---
def webSearchTool(query: str):
    search = DuckDuckGoSearchRun()
    res = search.invoke(query)
    return res

# --- Prompt Template ---
tool_calling_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant, who is designed to create planners. The user give anything for which you need to make a detailed plan for the user. For example, the user can ask "I want to learn DSA to crack interviews." or "I want to visit Ooty, make a itenary".

    You have access to the following tools:
    {tools}

    When the user asks a question that requires a tool, respond by setting the "tool_calling_required" flag as true.
    For example:
    {{
        "tool_calling_required" : true,
        "tool_name": "webSearchTool",
        "args": {{
            "query": "What is the roadmap for learning Full Stack development"
        }}
    }}
     
    Do NOT make up tool calls if you don't have enough information.
    If you have just received tool outputs, synthesize a natural language response for the user based on the chat history and the tool outputs.
    NOTE: 
    1. YOUR FINAL ANSWER SHOULD BE A JSON OBJECT WHICH I CAN DIRECTLY PARSE WITH json.loads PYTHON METHOD. YOUR FINAL ANSWER WILL BE A DIRECT INPUT TO A FRONTEND APPLICAION WHICH WILL BE MAPPED TO UI ELEMENTS.
    2. THE TASKS AND SUBTASKS GENERATED SHOULD BE VERY ELABORATE AND THORO - IT SHOULD HAVE THE DETAILED COMPLETE ROADMAP. SO YOU CAN CALL THE WEB SEARCH TOOL MULTIPLE TIMES IF YOU WANT TO GENERATE A MORE DETAILED LIST OF TASKS AND SUBTASKS.
    3. IF YOU HAVE THE FINAL ANSWER, "tool_calling_required" FIELD SHOULD BE false.
    The Structure of the final ans:
    {{
        "tool_calling_required" : false,
        "final_answer": {{
            "title": <Title of the query>,
            "description": <Title of the query>
            "task_list": <List of Tasks Object>
        }}
    }}
    JSON Structure of Task Object:
    {{
        "task_title" : <Title of Task>,
        "task_description": <Description of the task>
        "sub_tasks" : <List of Actions to complete this Task>
    }}
"""),
    ("placeholder", "{chat_history}"),
    ("user", "{input}")
])


tools_description = """
- Name: webSearchTool
  Description: Perform a web search using DuckDuckGo.
  Parameters:
    - query: string (REQUIRED) - The query to search on the web.
"""

# --- LLM ---
# Get OLLAMA_HOST from environment variable, default to localhost for local dev
ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# --- LLM ---
llm = ChatOllama(model="llama3.1", base_url=ollama_host, temperature=0.1)

# --- Agent State ---
class AgentState(TypedDict):
    input: str
    chat_history: Annotated[List[Any], operator.add]
    tool_calls: List[Dict[str, Any]]
    tool_outputs: List[Any]
    final_answer: Optional[str]

def call_llm(state: AgentState):
    print("Calling agent...")
    current_input_messages = []
    if not state["chat_history"]:
        current_input_messages.append(HumanMessage(content=state["input"]))
    messages_for_llm = state["chat_history"] + current_input_messages

    prompt_formatted = tool_calling_prompt.format(
        tools=tools_description,
        input=state["input"],
        chat_history=messages_for_llm
    )
    response = llm.invoke(prompt_formatted)
    content = response.content
    response_json = json.loads(content[content.find('{'): content.rfind('}') + 1])
    tool_calls = []
    final_answer = None

    tool_calling_required = response_json['tool_calling_required']
    if tool_calling_required:
        try:
            tool_calls.append(response_json)
        except json.JSONDecodeError:
            final_answer = content
    else:
        final_answer = response_json['final_answer']

    new_chat_history_entry = [AIMessage(content=content)]
    return {
        "chat_history": new_chat_history_entry,
        "tool_calls": tool_calls,
        "final_answer": final_answer
    }

def call_tool(state: AgentState):
    print("Calling tool...")
    tool_outputs = []
    for tool_call in state["tool_calls"]:
        tool_name = tool_call.get("tool_name")
        args = tool_call.get("args", {})
        if tool_name == "webSearchTool":
            output = webSearchTool(**args)
            tool_outputs.append(output)
            tool_message_content = {"tool_calls": [tool_call], "output": output}
        else:
            error_msg = f"Error: Tool '{tool_name}' not found."
            tool_outputs.append(error_msg)
            tool_message_content = {"tool_calls": [tool_call], "error": error_msg}
    return {
        "tool_outputs": tool_outputs,
        "chat_history": [ToolMessage(tool_message_content, tool_call_id=str(uuid.uuid4()))]
    }

def decide_next_step(state: AgentState):
    if state["tool_calls"]:
        return "call_tool"
    elif state["final_answer"]:
        return "end_chat"
    else:
        return END

# --- Build LangGraph ---
workflow = StateGraph(AgentState)
workflow.add_node("call_llm", call_llm)
workflow.add_node("call_tool", call_tool)
workflow.set_entry_point("call_llm")
workflow.add_conditional_edges(
    "call_llm",
    decide_next_step,
    {
        "call_tool": "call_tool",
        "end_chat": END
    }
)
workflow.add_edge("call_tool", "call_llm")
app_graph = workflow.compile()

# --- FastAPI Setup ---
app = FastAPI()

class QueryRequest(BaseModel):
    query: str

@app.post("/plan")
async def get_plan(request: QueryRequest):
    print(request)
    inputs = {"input": request.query, "chat_history": []}
    result = app_graph.invoke(inputs)
    return {"final_answer": result.get("final_answer")}

if __name__ == "__main__":
    uvicorn.run("agent:app", host="0.0.0.0", port=8003, reload=True)