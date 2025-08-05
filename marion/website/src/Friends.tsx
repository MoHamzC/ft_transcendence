import FuzzyText from "./FuzzyText";
import InfiniteMenu from './InfiniteMenu'
export default function Friends() {
 
const items = [
  {
    image: 'https://fbi.cults3d.com/uploaders/22757503/illustration-file/d2db82d1-47c1-4e13-9302-af32fe7648b6/sheikah_eye.png',
    link: 'https://google.com/',
    title: 'DinoMalinovski',
    description: 'This is pretty cool, right?'
  },
  {
    image: 'https://images.steamusercontent.com/ugc/867364351724766220/EEC0115AD646C400334078C4BE30BA2565EE8550/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false',
    link: 'https://google.com/',
    title: 'DinoMalinstava',
    description: 'This is pretty cool, right?'
  },
  {
    image: 'https://ik.imagekit.io/yynn3ntzglc/cms/Image_principale_chat_poil_long_c091891e9e_BWJBpJXFm.jpg?tr=w-1068&v=632652015',
    link: 'https://google.com/',
    title: 'DinoMalynx',
    description: 'This is pretty cool, right?'
  },
  {
    image: 'https://static.actu.fr/uploads/2018/08/25584-180830161125775-0-960x640.jpg',
    link: 'https://google.com/',
    title: 'Item 4',
    description: 'This is pretty cool, right?'
  }
];

  return (
	<div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
  <InfiniteMenu items={items}/>
</div>
  );
} 