import { Placeholder } from "@/components/placeholders/Placeholder";
import { QuestCard } from "@/components/cards/QuestCard";
import { LoadingWrapper } from "@/components/wrappers/LoadingWrapper";
import { useFetchQuests } from "@/hooks/useFetchQuests";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";

import { QuestWithCompletion } from "@/types";
import { getPinnedQuest } from "@/lib/client/localStorage/questPinned";
import { useQuestRequirements } from "@/hooks/useQuestRequirements";
import { Card } from "@/components/cards/Card";

export default function MPCPage() {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <span className="text-iron-600 font-sans text-xs">
        Discover connections with your social graph, using MPC for efficient
        results while maintaining your data privacy.
      </span>

      <Link href={`/mpc/fruits`}>
        <Card.Base className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Card.Title className="text-iron-950 text-sm font-bold">
                  🍎 Rate fruits
                </Card.Title>
                <span className="text-xs font-iron-600 font-sans">
                  Rate some fruits with your friends, discover how aligned you
                  are. Computes average and standard deviation without revealing
                  individual ratings.
                </span>
              </div>
            </div>
          </div>
        </Card.Base>
      </Link>

      <Link href={`/mpc/talks`}>
        <Card.Base className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Card.Title className="text-iron-950 text-sm font-bold">
                  3️⃣ Top 3 Talks
                </Card.Title>
                <span className="text-xs font-iron-600 font-sans">
                  {`Rate some talks, only reveal the top 3 after everyone votes.
                  Learn about which ones were most successful without putting
                  down other speakers.`}
                </span>
              </div>
            </div>
          </div>
        </Card.Base>
      </Link>

      <Link href={`/mpc/karma`}>
        <Card.Base className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Card.Title className="text-iron-950 text-sm font-bold">
                  ✨ Karma Calculator
                </Card.Title>
                <span className="text-xs font-iron-600 font-sans">
                  {`Update each other's karma privately, only reveal the net karma
                  given/received at the end of the round. Inspired by Barry &
                  CC.`}
                </span>
              </div>
            </div>
          </div>
        </Card.Base>
      </Link>
    </div>
  );
}
