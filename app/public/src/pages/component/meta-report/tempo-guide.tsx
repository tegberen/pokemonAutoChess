import { useTranslation } from "react-i18next"
import {
  generateStageInfo,
  StageIcon,
  StagePath
} from "../stage-path/stage-path"
import "./tempo-guide.css"

type StagePlan = {
  stage: number
  label: string
  headline: string
  advice: string
  zone: "green" | "orange" | "red" | "late"
}

const stagePlan: StagePlan[] = [
  {
    stage: 4,
    label: "Carousel",
    headline: "Commit no items (unless you have an upgraded Pokemon)",
    advice:
      "Unless you are lucky, in most games you won't have a perfect pair (2/3 of BiS). It's rarely correct to level to 4 here, unless you have the strong spot to win the early game or most of it.",
    zone: "green"
  },
  {
    stage: 5,
    label: "Uncommon addpick",
    headline: "Start committing 2 items",
    advice:
      "In regular game carousels, you will now have 6 components. Make 2 items (or 3 if you are lucky).",
    zone: "green"
  },
  {
    stage: 8,
    label: "Rare addpick",
    headline: "Ideally commit the 3rd item to maintain tempo",
    advice:
      "If you slammed 2 items and held on to components, you could slam the third now. If no items are slammed yet, you should be looking out for a triple BiS T10.",
    zone: "green"
  },
  {
    stage: 10,
    label: "Unique pick",
    headline: "Have 2 or 3 out of 4 items crafted",
    advice:
      "The easiest way to create and maintain tempo is clicking the correct T10s. Learn all the T10s, they are usually consistent across many patches. If you open forted or pseudo-open forted, make sure you click a T10 and go true BiS right away to start recovering from your loss streak.",
    zone: "orange"
  },
  {
    stage: 11,
    label: "Epic addpick",
    headline: "Have 3 committed items of 4.5 items",
    advice: "Usually I like to sit on components here.",
    zone: "orange"
  },
  {
    stage: 12,
    label: "Carousel",
    headline: "Have 5 items crafted NOW!",
    advice:
      "This is the most important stage of the mid game, and sets the foundation for your late game. Commit as many items as possible here.",
    zone: "red"
  },
  {
    stage: 14,
    label: "Mew Duo",
    headline: "Finish the 5th item by NOW!",
    advice:
      "After stage 12, just slam any items you get along the way. Just defeated Mew Duo? Make an item.",
    zone: "late"
  },
  {
    stage: 17,
    label: "Carousel",
    headline: "Hold items until stage 19 (Tower Duo), or commit the 6th item",
    advice:
      "Just picked your component at stage 17? Make an item. It's okay to not have perfect slams, you can always fix your items on later carousel stages.",
    zone: "late"
  }
]

const zoneLabels: Record<StagePlan["zone"], string> = {
  green: "Green zone",
  orange: "Orange zone",
  red: "Red zone",
  late: "Late game"
}

export function TempoGuide() {
  const { t } = useTranslation()
  const allStages = generateStageInfo(t)
  const zoneByStage = Object.fromEntries(
    stagePlan.map((plan) => [plan.stage, plan.zone])
  )

  return (
    <div className="tempo-guide">
      <section className="my-box tempo-section">
        <h2>I. When Items?</h2>
        <p>
          It's stage 22 of the game, and you just went 8th. Woooooooooo. Now
          there are many things you could blame here: I lowrolled and didn't hit
          my units, my portal got stolen, everyone was contesting me, I didn't
          find a single component, yada yada yada.
        </p>
        <p>
          You went out at stage 22, including the KO round. In this game you
          just queued, you effectively only played the game for 16 stages
          (excluding PvE rounds).
        </p>
        <p>
          This is important to understand. The "game" is finite. I am sure
          people who read this guide already know BiS itemization and know which
          items have worked in the past when playing their favourite synergy. So
          the actual thing you ask yourself is not <em>what items</em>, but{" "}
          <strong>when items</strong>.
        </p>
        <p className="tempo-rule">Rule 1 - "When items?"</p>
        <p>
          It's important to understand that you eventually have to make items.
          If you keep those items and components on bench, you are essentially
          playing 50%, 70% or even 90% of the game without them. This could be a
          reason why you just bot 4'd. In comparison to other players, you were
          essentially down 1/2/3/4 - whatever amount of items - the whole game.
        </p>
        <p>
          Think of stage 12 like the game is already half played, and not stage
          20. At stage 20 the game is already about to finish. Items should
          always be made early.
        </p>
        <p>
          The way I like to play the game is "slam now, worry later". It's
          cheap, making items costs no gold. You can focus on levelling. HP is
          another resource to cap your board.
        </p>
      </section>

      <section className="my-box tempo-section">
        <h2>Stage by stage</h2>
        <StagePath stages={allStages} zoneByStage={zoneByStage} />
        <ol className="tempo-timeline">
          {stagePlan.map(({ stage, label, headline, advice, zone }) => (
            <li key={stage} className={`tempo-stage tempo-zone-${zone}`}>
              <div className="tempo-stage-head">
                <div className="tempo-stage-icons">
                  {allStages
                    .filter((stageInfo) => stageInfo.level === stage)
                    .map((stageInfo) => (
                      <StageIcon
                        key={stageInfo.type}
                        stage={stageInfo}
                        zone={zone}
                      />
                    ))}
                </div>
                <div className="tempo-stage-titles">
                  <span className="tempo-stage-label">
                    Stage {stage} ({label})
                    <span className="tempo-stage-zone">{zoneLabels[zone]}</span>
                  </span>
                  <span className="tempo-stage-headline">{headline}</span>
                </div>
              </div>
              <p>{advice}</p>
            </li>
          ))}
        </ol>
        <p>
          If you are winning rounds 10 and 11, you have to commit to the highest
          current cap. That means sometimes you even roll a bit on level 6 at
          stage 12, and sometimes you just take the free units the game gives
          you - in order to have the highest chances to continue winning the
          fights on stage 12 and 13.
        </p>
        <p>
          You create tempo and maintain tempo by doing those proper item slams
          on time and clicking the right units. Clicking the right units is
          easy, just ask around which synergies and Pokemon are strong or
          "meta". If you want to enter high elo, you need to learn to win fights
          without spending much gold. Every good player knows how to optimize
          their loss by making the right item choices on time.
        </p>
      </section>

      <section className="my-box tempo-section">
        <h3 className="tempo-tips-title">Tips</h3>
        <ul className="tempo-pins">
          <li>
            <img src="/assets/icons/FOSSIL_PIN_ICON.svg" alt="" />
            <span>
              Whenever you addpick or win a PvE round, think about if you can
              make an item.
            </span>
          </li>
          <li>
            <img src="/assets/icons/FOSSIL_PIN_ICON.svg" alt="" />
            <span>
              3 items T10 is the cheapest consistent tempo play, somewhere
              between stage 10 and 12.
            </span>
          </li>
        </ul>
      </section>

      <section className="my-box tempo-section">
        <h2>II. Roll now. Level later.</h2>
        <p>
          It's stage 15 of the game. If you started applying the rules so far,
          you will notice in most games you will be level 7 by stage 15, with a
          little or a lot of gold above the 50 gold econ mark. If you spectate
          high elo lobbies, you will notice two things:
        </p>
        <ul className="tempo-thumbs">
          <li>
            People will start rolling a bit on level 7 looking for upgrades.
            This is good - whoever rolls earlier, hits earlier. If the consensus
            in high elo is rolling after stage 14 (Mew Duo), you should too.
            This way you
            match their new powerspike and can keep up with the lobby's tempo.
          </li>
          <li>
            People hold onto their gold above 50, send it to level 8, have
            somewhere between 20 to 40 gold and start rolling all the way down
            to true zero to hit their final late game board.
          </li>
        </ul>
        <p>
          These are two very consistent patterns for high elo ranked lobbies. If
          you played this game before 6.0, going fast 9 might have been the
          "meta". If you want to see consistent results after 6.0, going fast 9
          is always wrong. For most synergies, upgrade your board on 8 first,
          then think about going 9. Do not spend all your gold when you are on
          your last life - this is the ultimate beginner mistake. Roll when you
          are still healthy!
        </p>
        <p className="tempo-rule">Rule 2 - "Roll now. Level later."</p>
        <p>
          If you are losing, you have to spend your gold. If you are winning,
          you should spend your gold. Your opponents are rolling anyway - they
          have no choice! Match their pace, win the game. Well, it will not
          always work, but at least you tried. There is no point in holding on
          to your gold for too long. This is the first thing you have to accept
          once you enter the harder lobbies.
        </p>
        <blockquote className="tempo-quote">
          Positioning does indeed decide high elo games since everything else is
          already optimized
          <cite>mxnk</cite>
        </blockquote>
        <p>
          Positioning is what separates good players from great ones. Optimizing
          your positioning to win the next round is free, it costs no gold as
          well. By rolling down early, you have the time to scout your opponent.
          Roll roll roll! Let it ride!
        </p>
      </section>

      <section className="my-box tempo-section">
        <h3 className="tempo-tips-title">Tips</h3>
        <ul className="tempo-pins">
          <li>
            <img src="/assets/icons/FOSSIL_PIN_ICON.svg" alt="" />
            <span>
              Stage 14 (Mew Duo) is the cue to start spending your gold and
              stop econ. Get used to not being above 50 gold after it.
            </span>
          </li>
          <li>
            <img src="/assets/icons/FOSSIL_PIN_ICON.svg" alt="" />
            <span>
              Unsure whether to level or to roll? Always roll, no matter how
              much HP you have, and especially after stage 20.
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
