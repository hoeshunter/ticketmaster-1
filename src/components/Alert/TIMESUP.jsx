import './Alert.css';

export default function TIMESUP({ onTryAgain }) {
    return (
        <div className='timeup'>
            <div>
            <p>Time's Up</p>
            <p>Your time limit to secure these tickets <br /> has expired. You will need to select new <br /> tickets to purchase.</p>
            <button style={{ cursor: 'pointer' }} onClick={onTryAgain}>Try Again</button>
            </div>
        </div>
    )
}