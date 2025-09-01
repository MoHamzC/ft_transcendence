import React from 'react';


function Avatar({ player, ringClass }) {
  const safeName = player && player.name ? player.name : '—';
  const hasImg = player && player.img && String(player.img).trim().length > 0;
  const initials = safeName !== '—' ? safeName.split(' ').filter(Boolean).slice(0,2).map(s => s[0] ? s[0].toUpperCase() : '').join('') : '';

  const cls = ['-mt-8','w-16','h-16','rounded-full','border-4','overflow-hidden','bg-purple-900','flex','items-center','justify-center', ringClass || ''].join(' ');

  return (
    <div className={cls}>
      {hasImg ? (
        <img src={player.img} alt={safeName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-purple-100 font-bold">{initials || '?'}</span>
      )}
    </div>
  );
}

function Step({ rank, player, height, tone, badgeClass, ringClass }) {
  const boxCls = [tone,'rounded-t-2xl','w-28',height,'flex','flex-col','items-center','justify-end','shadow-lg','relative', "hover:scale-105", "transition"].join(' ');
  return (
    <div className="flex flex-col items-center">
      <div className={boxCls}>
        <Avatar player={player} ringClass={ringClass} />
        <p className="text-white font-semibold mt-2 truncate w-full text-center px-2">{(player && player.name) ? player.name : '—'}</p>
      </div>
      <p className={[badgeClass,'font-semibold','mt-1'].join(' ')}>{rank}</p>
    </div>
  );
}

export default function Podium({ first = null, second = null, third = null }) {
  return (
    <div className="flex items-end justify-center gap-6 p-6">
      <Step rank={2} player={second} height="h-36" tone="bg-purple-700" badgeClass="text-purple-200" ringClass="border-purple-300" />
      <Step rank={1} player={first}  height="h-44" tone="bg-purple-600" badgeClass="text-yellow-300" ringClass="border-yellow-300" />
      <Step rank={3} player={third}  height="h-32" tone="bg-purple-800" badgeClass="text-orange-300" ringClass="border-orange-300" />
    </div>
  );
}
