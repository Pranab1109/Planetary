// src/components/RoadmapCardSkeleton.jsx
import React from 'react';

const RoadmapCardSkeleton = () => {
    return (
        <div className="bg-white p-6 rounded-lg w-4/5 shadow-md mb-4 animate-pulse border border-light-border ">
            {/* Title Skeleton */}
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            {/* Sub-title Skeleton */}
            <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6 mb-5"></div>

            {/* List Item Skeletons */}
            <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-11/12"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
        </div>
    );
};

export default RoadmapCardSkeleton;