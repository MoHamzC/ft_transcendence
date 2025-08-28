import './Error.css';
import FuzzyText from "./FuzzyText";

export default function Error() {
    return (
        <div className="error-overlay">
            <div className="error-content">
                <h1>
                    <FuzzyText>404 - Error</FuzzyText>
                </h1>
            </div>
        </div>
    );
}