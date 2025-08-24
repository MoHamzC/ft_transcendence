import FuzzyText from "./FuzzyText";

export default function Error() {
    return (
        <div
            style={{
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                textAlign: "center",
            }}
        >
            <h1>
                <FuzzyText>404 - Error</FuzzyText>
            </h1>
        </div>
    );
}