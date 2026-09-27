import nav1 from '/nav1.jpg';
import nav2 from '/nav2.jpg';
import nav3 from '/nav3.jpg';
import nav4 from '/nav4.jpg';
import nav5 from '/nav5.jpg';
import '../App.css';

// Order: Home, For you, Tickets, Sell, Account
const NAV_IMAGES = [nav1, nav2, nav3, nav4, nav5];

const BottomNav = ({ activeIndex, setActiveIndex }) => {
    // Custom click zones based on actual button positions
    const handleClick = (e) => {
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - left;
        const clickPercent = clickX / width;

        let index;
        if (clickPercent < 0.20) {
            index = 0;  // Home
        } else if (clickPercent < 0.40) {
            index = 1;  // For you
        } else if (clickPercent < 0.60) {
            index = 2;  // Tickets
        } else if (clickPercent < 0.80) {
            index = 3;  // Sell
        } else {
            index = 4;  // Account
        }

        setActiveIndex(index);
    };

    return (
        <div className='BottomNav'>
            <img
                src={NAV_IMAGES[activeIndex]}
                alt={`nav-${activeIndex + 1}`}
                className='nav-image'
                onClick={handleClick}
            />
        </div>
    );
};

export default BottomNav;