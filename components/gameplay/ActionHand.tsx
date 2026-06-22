"use client";

import { getActionCard } from "@/lib/data/campaign/actionCards";
import type { GameState } from "@/lib/engine";
import { useGameStore } from "@/store/gameStore";
import { ActionCard } from "./ActionCard";
import { ActionPointBar } from "./ActionPointBar";

export function ActionHand({ game }: { game: GameState }) {
  const playActionCard = useGameStore((state) => state.playActionCard);
  if (!game.campaign?.enabled || !game.cards || !game.actionPoints) return null;

  const company = game.companies.find((item) => item.id === game.playerCompanyId);
  const cards = game.cards.handCardIds
    .map((cardId) => getActionCard(cardId))
    .filter((card): card is NonNullable<typeof card> => !!card);

  return (
    <section className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-brand-600">CEO 행동 카드</div>
      <div className="mt-2">
        <ActionPointBar actionPoints={game.actionPoints} />
      </div>
      <div className="mt-3 grid gap-2">
        {cards.length > 0 ? cards.map((card) => {
          const disabled =
            game.actionPoints!.current < card.actionPointCost ||
            (card.cashCost ?? 0) > (company?.cash ?? 0);
          return (
            <ActionCard
              key={card.id}
              card={card}
              disabled={disabled}
              simple={game.config.simplifiedLabels}
              onPlay={() => playActionCard(card.id)}
            />
          );
        }) : (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            다음 분기에 새 카드가 들어옵니다.
          </div>
        )}
      </div>
    </section>
  );
}
