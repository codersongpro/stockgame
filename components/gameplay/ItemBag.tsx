"use client";

import { ITEM_RARITY_LABELS, ITEM_RARITY_STYLE, getItemDefinition } from "@/lib/data/campaign/items";
import { getUsableItemsForEvent, type GameState, type ItemDefinition, type ItemRarity } from "@/lib/engine";
import { useGameStore } from "@/store/gameStore";

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function ItemBag({ game }: { game: GameState }) {
  const playItemAction = useGameStore((state) => state.useItem);
  if (!game.campaign?.enabled || !game.items) return null;

  const ownedItems = Object.entries(game.items.quantitiesByItemId)
    .map(([itemId, count]) => ({ item: getItemDefinition(itemId), count }))
    .filter((entry): entry is { item: ItemDefinition; count: number } => !!entry.item && entry.count > 0)
    .sort((a, b) => RARITY_RANK[b.item.rarity] - RARITY_RANK[a.item.rarity] || a.item.name.localeCompare(b.item.name));
  const activeEvents = game.strategy.majorEvents.filter((event) => event.status === "active");
  const recentReward = game.items.recentRewards[0];
  const recentRewardItem = recentReward ? getItemDefinition(recentReward.itemId) : undefined;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">아이템 가방</div>
          <div className="text-sm font-black text-slate-800">{ownedItems.length}종 보유</div>
        </div>
        {recentRewardItem && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ITEM_RARITY_STYLE[recentRewardItem.rarity]}`}>
            새 보상 {recentRewardItem.name}
          </span>
        )}
      </div>

      {ownedItems.length === 0 ? (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm leading-5 text-slate-500">
          성실하게 운영하고 캠페인 목표를 달성하면 아이템을 얻을 수 있습니다.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {ownedItems.slice(0, 6).map(({ item, count }) => (
            <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-black text-slate-800">{item.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ITEM_RARITY_STYLE[item.rarity]}`}>
                      {ITEM_RARITY_LABELS[item.rarity]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      x{count}
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">
                    {game.config.simplifiedLabels ? item.simpleDescription : item.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeEvents.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-bold text-bear">이벤트에 바로 사용</div>
          {activeEvents.map((event) => {
            const usableItems = getUsableItemsForEvent(game, event);
            if (usableItems.length === 0) return null;
            return (
              <div key={event.id} className="rounded-lg bg-red-50 px-3 py-2">
                <div className="text-xs font-black text-red-700">{event.title}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {usableItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => playItemAction(item.id, event.id)}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                    >
                      {item.emoji} {item.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
