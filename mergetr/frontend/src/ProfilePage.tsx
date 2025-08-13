import ProfileCard from "./ProfileCard";
import "./ProfilePage.css";

export default function ProfilePage() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexDirection:"row"}} className="profile-page">
     <ProfileCard className="profile-card"
  name="Amir "
  title="L'etalon de minuit"
  handle="amir"
  status="Online"
  contactText="Contact Me"
  avatarUrl="https://i.pinimg.com/736x/84/82/d9/8482d981a94d40a27ddbf3a0e8727469.jpg"
  showUserInfo={true}
  enableTilt={true}
  enableMobileTilt={false}
  onContactClick={() => console.log('Contact clicked')}
/>
 <ProfileCard className="profile-card"
  name="Lucas"
  title="Game designer"
  handle="caca"
  status="Online"
  contactText="Contact Me"
  avatarUrl="https://i.pinimg.com/736x/5a/ea/00/5aea0030ddc03fac1960ee70146f5f6b.jpg"
  showUserInfo={true}
  enableTilt={true}
  enableMobileTilt={false}
  onContactClick={() => console.log('Contact clicked')}
/>
 <ProfileCard className="profile-card"
  name="Loris"
  title="Miniklar"
  handle="loris"
  status="Online"
  contactText="Contact Me"
  avatarUrl="https://i.pinimg.com/736x/b1/52/1c/b1521c1e66a349f3ddbfb1facabc11a7.jpg"
  showUserInfo={true}
  enableTilt={true}
  enableMobileTilt={false}
  onContactClick={() => console.log('Contact clicked')}
/>
 <ProfileCard className="profile-card"
  name="Clement"
  title="Le forgeron"
  handle="clement"
  status="Online"
  contactText="Contact Me"
  avatarUrl="https://i.pinimg.com/736x/b1/52/1c/b1521c1e66a349f3ddbfb1facabc11a7.jpg"
  showUserInfo={true}
  enableTilt={true}
  enableMobileTilt={false}
  onContactClick={() => console.log('Contact clicked')}
/>

 <ProfileCard className="profile-card"
  name="Marion"
  title="Mrn"
  handle="mhhh"
  status="Online"
  contactText="Contact Me"
  avatarUrl="https://i.pinimg.com/1200x/c2/52/9c/c2529c3c9209dbb76267f2f8563bd19a.jpg"
  showUserInfo={true}
  enableTilt={true}
  enableMobileTilt={false}
  onContactClick={() => console.log('Contact clicked')}
/>

	</div>
  );
}