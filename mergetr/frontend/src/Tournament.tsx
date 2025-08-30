import FuzzyText from "./FuzzyText";
import TargetCursor from "./TargetCursor";

export default function Tournament()
 { 
    const buttonStyle: React.CSSProperties = {
        background: 'oklch(38% 0.189 293.745)',
        color: 'white',
        width: '500px',
        height: '120px',
        fontSize: '2rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.15s',
      };
    return(
        <div> 
                  <TargetCursor spinDuration={2} hideDefaultCursor={true} />
        <FuzzyText>Tournament</FuzzyText>
        <div>
            <button>Player List</button>
        </div>
        <div className="flex flex-row gap-8 mt-8">
          <div>
            <h1 className="text-xl font-bold mb-4 text-[#7e3ff2]">Semi final</h1>
            <button className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target mb-4" style={buttonStyle}>
              <div className="flex flex-col items-center w-full">
                <span className="text-base mb-2">Match #1</span>
                <div className="flex gap-2 mb-2">
                  <button className="bg-[#7eeaff] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat2</button>
                  <span className="text-white font-bold">0</span>
                  <span className="text-[#b3b3b3]">VS</span>
                  <button className="bg-[#ffd1dc] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat3</button>
                  <span className="text-white font-bold">5</span>
                <span className="text-[#ffe066] text-sm">Insert winer</span>
                </div>
              </div>
            </button>
            <button className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target hover:scale-105 cursor-target" style={buttonStyle}>
              <div className="flex flex-col items-center w-full">
                <span className="text-base mb-2">Match #2</span>
                <div className="flex gap-2 mb-2">
                  <button className="bg-[#7eeaff] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat2</button>
                  <span className="text-white font-bold">5</span>
                  <span className="text-[#b3b3b3]">VS</span>
                  <button className="bg-[#ffd1dc] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat1</button>
                  <span className="text-white font-bold">0</span>
                </div>
                <span className="text-[#ffe066] text-sm">Insert winner </span>
              </div>
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-4 text-[#7e3ff2]">Final</h1>
            <button className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target" style={buttonStyle}>
              <div className="flex flex-col items-center w-full">
                <span className="text-base mb-2">Match #1</span>
                <div className="flex gap-2 mb-2">
                  <button className="bg-[#7eeaff] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat</button>
                  <span className="text-[#b3b3b3]">VS</span>
                  <button className="bg-[#ffd1dc] text-[#23243a] font-bold px-3 py-1 rounded shadow hover:scale-105 cursor-target">chat4</button>
                </div>
                <span className="text-[#ffd1dc] text-sm">win/loss</span>
              </div>
            </button>
          </div>
        </div>
        </div>
        

    )
 }
