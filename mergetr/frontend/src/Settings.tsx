import FuzzyText from "./FuzzyText";
import MyToggle from "./MyToggle";
export default function Settings () {
  return (
	<div className="settings">
	  <FuzzyText>Settings</FuzzyText>
	  <div>
		<div className="setting-item flex flex-direction-column gap-4">
		<h2> Double Auth</h2>
		 <MyToggle 
            onChange={(checked) => console.log('Toggle: Double Auth', checked)}
            defaultChecked={false}
        />
		<h2> Private Profile</h2>
		<MyToggle 
            onChange={(checked) => console.log('Toggle: Private Profile', checked)}
            defaultChecked={false}
        />
		<h2> Friends request</h2>
		<MyToggle 
            onChange={(checked) => console.log('Toggle: Private Profile', checked)}
            defaultChecked={false}
        />
		
				</div>
	  </div>
	</div>
  );
}