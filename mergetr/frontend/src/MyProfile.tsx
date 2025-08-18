import FuzzyText from "./FuzzyText";
import GooeyNav from './GooeyNav'

const items = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

export default function MyProfile()
{
    return (
        <div className="myprofile">
            <FuzzyText>Profile</FuzzyText>
            <p>Coming soon</p>
            <div style={{ height: '600px', position: 'relative' }}>
                <GooeyNav
                    items={items}
                    particleCount={15}
                    particleDistances={[90, 10]}
                    particleR={100}
                    initialActiveIndex={0}
                    animationTime={600}
                    timeVariance={300}
                    colors={[1, 2, 3, 1, 2, 3, 1, 4]}
                />
            </div>
        </div>
    )
}