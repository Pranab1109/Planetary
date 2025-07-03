import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { useRoadmap } from '../context/roadmapContext';
const Header = (props) => {
    const { showAuthModal, setShowAuthModal } = props;
    const { viewDashboard } = useRoadmap();
    const { isAuthenticated, signIn, signOut, user } = useAuth();
    return (
        <div className="navbar sticky flex items-center  justify-between text-2xl p-5">
            <p onClick={() => { viewDashboard() }} className='font-bold cursor-pointer'>Planetary</p>
            {isAuthenticated ? (
                <div className="cursor-pointer">
                    <span className='mr-4 font-semibold'>{user.name}</span>
                    <i
                        className="fa-solid fa-circle-user "
                        title="Click to Sign Out"
                    />
                </div>

            ) : (
                <Button
                    variant="primary"
                    size="md"
                    className="flex-shrink-0 w-28"
                    onClick={() => {
                        console.log("Clicking Button")
                        setShowAuthModal(true)
                    }}
                >
                    <i className="fa-solid fa-right-to-bracket mr-2"></i><span>Sign In</span>
                </Button>
            )}
        </div>
    );
}

export default Header;
