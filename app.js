/* Spell Builder - single-file state + UI wiring (no frameworks) */

/**
 * NOTES / Extensibility
 * - Effects are defined in EFFECT_LIBRARY. Add/modify effects there.
 * - Costs:
 *   - tokenCost consumes tokens (from allocated pool)
 *   - bpCost contributes to BP
 *   - nCostPerUnit/xCostPerUnit scale with per-effect N/X values (optional)
 *   - subjectCost/powerCost/temperCost/flourishCost consume word currency (2 each)
 * - Sentence priority: lower numbers appear earlier.
 */

const ASPECTS = [
  "Arcane",
  "Astral",
  "Blood",
  "Fate",
  "Elemental",
  "Pact",
  "Hollow",
  "Soul",
  "Rune",
  "Shadow",
  "Phantasm",
  "Void",
];

/** @type {Record<string, {id: string, name: string, aspect: string|null, aspects?: string[], universal?: boolean, stackable?: boolean, tokenCost?: number, bpCost?: number, subjectCost?: number, powerCost?: number, temperCost?: number, flourishCost?: number, addSubject?: number, addPower?: number, addTemper?: number, addFlourish?: number, nVar?: boolean, xVar?: boolean, nCostPerUnit?: number, xCostPerUnit?: number, tags?: string[], priority: number, order?: number, desc?: string, shortDesc?: string, nLabel?: string, xLabel?: string }[]>} */
const EFFECT_LIBRARY = (() => {
  // Hardcoded effect source (kept as raw text for easier maintenance).
  const RAW = String.raw`Literally Every Effect
Subject
All Things Under the Sky (2 Subject, +3 Cost) — Astral
Area
This spell affects all creatures on the battlefield. This spell cannot create obstacles or modify terrain. Under no circumstances can you be excluded or exempt from the effects of the spell.

Aura (Subject, +1 Cost) — Astral, Fate, Soul
Area, Radius
This spell affects all blocks in a 1-block radius centered on your space. If this spell has the Linger or Magick Circle effect, the area moves with you. You may choose to not be affected by the spell.
Augment (2 Subject, +2 Cost): Increase radius to 2 blocks.

Master’s Boon (Subject, +2N Cost) — Hollow
This spell affects N creatures of your choice to which your Thralls are attached.
Augment (2 Subject, +5 Cost): Your spell affects all creatures to which your Thralls are attached.

Burst (Subject, +1 Cost) — Blood, Hollow, Soul
Area, Radius
This spell affects all blocks and creatures in a 2-block radius centered on your space. You may choose to not be affected by the spell. Incompatible with Range effects.
Augment (2 Subject, +1 Cost): Increase radius to 4 blocks.

Ends of the Earth (Subject, +5 Cost) — Astral
Range
This spell has infinite Range. In the absence of other Subject effects, it targets a single block or creature. Incompatible with other Range effects.

Fork (Subject, +3 Cost) — Arcane, Shadow
The spell targets and affects three creatures or blocks within range. Requires a Range effect.

Free Line (Subject, +2 Cost) — Astral, Elemental, Pact, Phantasm, Rune, Shadow
Area
This spell affects all blocks and creatures in a straight line between two points within range. Requires a Range effect.

Steal Soul (Subject, +5 Cost) — Pact
This spell requires a Deal effect. Instead of receiving the Deal effect, you give the Deal effects to a willing affected ally.

Stretch Through Shadow (Subject, +2 Cost) — Shadow
This spell may be cast as though your position is your Shadow’s position, including for determining adjacency.

Frugal Subject (Subject, -1 Cost) — Universal
No effect. You may take this effect multiple times.

Line (Subject, +1 Cost) — Universal
Area
This spell targets one block within its range. It affects all blocks and creatures on a straight line between you and the targeted block. You may choose to be affected by the spell. Requires a Range effect.

Manifest Void (Subject, +3 Cost) — Void
Taking this effect adds 2 Words to your Flourish. Requires a Radius effect. The radius created by this spell becomes a Void with a Size attribute equal to the size of the original radius. If Size changes, the Void’s radius changes to match. The Void can be targeted as if it is an enemy creature with 0 AC. Its maximum HP is equal to Size×Spirit, and changes to match Size. The Void is destroyed if its HP reaches 0 or you cast another spell with the Manifest Void effect.

Radius (Subject, +1 Cost) — Universal
Area, Radius
Requires a Range effect. The spell must target one block within its range. It affects all blocks and creatures in a 2-block radius centered on the targeted block.
Augment (2 Subject, +1 Cost): Increase affected radius to 3 blocks

Radius, Improved (Subject, +1 Cost) — Elemental, Void
Area, Radius
Requires a Range effect. The spell must target one block within its range. It affects all blocks and creatures in a 3-block radius centered on the targeted block. 
Augment (2 Subject, +1 Cost): Increase affected radius to 4 blocks.

Radius, Unlimited (Subject, +3X Cost) — Elemental
Area, Radius
Requires a Range effect. The spell must target one block within its range. It affects all blocks and creatures in a X-block radius centered on the targeted block. 
Augment (2 Subject, 1+3X cost): As above, but the radius is 3+X.

Range (Subject, +X Cost) — Universal
Range
This spell has a Range of 5X blocks. In the absence of other Subject effects, it targets a single block or creature. Incompatible with other Range effects.
Augment (2 Subject, +1 Cost): Increase Range to 20 blocks.

Renounce Subject (Subject, -4 Cost) — Arcane
No effect. You may take this effect multiple times.

Snake (Subject, +1 Cost) — Elemental, Pact, Shadow
Area
This spell targets a formation of 6 blocks within range. The formation is drawn one block at a time, starting at a point within range and placing each subsequent block adjacent to the last. Requires a Range effect.
Augment (2 Subject, +2 Cost): As above, but the snake is composed of 12 blocks instead of 6.

Touch (2 Subject, -1 Cost) — Universal
The spell has a range of Touch. It targets and affects a single block or creature within your melee range. The cast action for this spell does not trigger Cut Down. Incompatible with all Subject effects except Frugal Subject.

Void Current (2 Subject, +2 Cost) — Void
Area, Radius
This spell must be cast inside a Void. The spell affects all blocks and creatures in a radius that fills the inside of the Void. You may exclude yourself and your allies. If the spell creates a persistent area of effect, the radius changes to match the radius of the Void and disappears if the Void is destroyed. The cast action for this spell does not trigger Cut Down.

Power
Bestow Suffering (Power, +8 Cost) — Soul
Harm, Link, Persistent
This spell must target a single creature. Whenever you take damage, you deal half that amount of damage to the affected creature.

Bleed With Me (Power, +10 Cost) — Blood
Harm, Instant
This spell must have no effects that require it to target a single creature. This spell deals 2×Spirit additional damage. Regardless of how this spell is targeted, you are affected by the spell.

Bless (Power, +3N Cost) — Soul
Boon, Persistent
Affected creatures gain 2N HP.

Blood Oath (Power, +3X Cost) — Blood
Conditional, Harm, Instant, Link
This spell must target a single creature. You read the current HP of the target immediately after casting the spell, and a second time at the end of your next turn. The amount by which the first reading exceeds the second is your Tithe. If your Tithe is at least 10X, the target Ruptures. A Rupture deals Xd6 damage to the target.
After you count your Tithe and resolve any Rupture that occurs, the target is cleansed of this effect.
All Rupture effects in this spell with a variable X must use the same value for X as this effect.

Bountiful Spirit (Power, +7 Cost) — Soul
Boon, Persistent
All boosts performed by affected creatures require one less boost point to a minimum of 1.

Clawmark (Power, +8N Cost) — Blood
Harm, Persistent
Strikes made against affected creatures deal Nd6 additional damage, to a maximum of 10d6.
Augment (2 Power, +10 Cost): Strikes made against affected creatures deal 4d6 additional damage.

Communion (Power, +6 Cost) — Blood
Boon, Link, Persistent
Affected creatures receive all benefits granted to you by spell effects that are both Rupture and Link.

Compulsion (Power, +10 Cost) — Phantasm
Bane, Instant
This spell must target a single creature. The target creature immediately makes a strike against a creature of your choice (or their choice, if they are an allied Avatar). The creature must be a valid target for the strike. 
Augment (Temper, +4 Cost): This spell must target a single creature. The target creature immediately makes a strike against a creature of your choice (or their choice, if they are an allied Avatar) if they have your Illusion with an Intensity of 1 or greater. The creature must be a valid target for the strike.

Conditional Strength (Power, +7 Cost) — Rune
This spell must have either a Raw Healing or Raw Damage effect. For every Trigger effect added to this spell, the healing or damage of the spell is increased by Spirit.

Conjure Thralls (Power, Cost +X) – Hollow
You conjure a host of Thralls that is attached to all creatures affected by the spell. The Thralls start with a Presence of X, to a maximum equal to your level. The Thralls can be targeted or affected as if they are a creature occupying the space of every attached combatant. When damaged by an action, their Presence is reduced by 1. If the Thralls' Presence reaches 0 or you conjure Thralls again, this host of Thralls is destroyed. Attachment to Thralls is not a cleansable effect.
Augment (2 Power, Cost +1+X): The Thralls start with a Presence of 5+X, to a maximum equal to 5 or your level, whichever is higher.

Crush (Power, +8 Cost) — Void
Harm
Requires Void Current. This spell deals Spirit additional damage. The Size of your Void decreases by 5. If the Size of your Void is reduced to 0 in this way, it is destroyed. Incompatible with Manifest Void.
Augment (2 Power, +15 Cost): Your Void must have a Size no less than 10. This spell deals 2xSpirit additional damage. Your Void is destroyed.

Damage (Power, +3 Cost) — Universal
Instant, Raw Damage
This spell deals 3d6+Spirit damage. Incompatible with other Raw Damage effects.
Augment (3 Power, +4 Cost): Increase damage to 3d6+2×Spirit.

Damage, Unlimited (Power, +3+3X Cost) — Arcane
Instant, Raw Damage
This spell deals Xd6+Spirit damage. Incompatible with other Raw Damage effects.
Augment (3 Power, +4+3X Cost): Increase damage to Xd6+2×Spirit.

Death Hex (Power, +3 Cost) — Hollow
Requires Conjure Thralls. When your Thralls are destroyed, attached enemies and enemies adjacent to attached creatures take damage equal to Spirit.

Divest Power (Power, +0 Cost) — Universal
Add 1 Word to this spell’s Flourish phrase. You may take this effect multiple times.

Enmity (2 Power, +7 Cost) — Soul
Harm, Link, Persistent
This spell must target a single creature. When you hit an affected creature with a strike, you deal additional damage equal to your Spirit.

Epicenter (Power, +10 Cost) — Elemental
Harm, Instant
Requires a Radius effect. This spell deals Spirit additional damage to any creature occupying the block at the center of the radius.

Forbiddance (Power, +5 Cost) — Phantasm
Bane, Transient
Affected creatures with your Illusion with an Intensity of 3 or greater cannot make strikes. If an affected creature takes damage, it is cleansed of this effect.

Frugal Power (Power, -1 Cost) — Universal
No effect. You may take this effect multiple times.

Hand of the Master (Power, +6 Cost) — Hollow
Harm, Instant
If an affected creature is attached to your Thralls, the spell deals additional damage equal to the Thralls' Presence.

Harden Flesh (Power, +10 Cost) — Blood
Boon, Persistent
Affected creatures gain +3 to Strength, +3 Grit, and +6 DR. Each affected creature can only benefit from one instance of this effect.
Augment (2 Power, +12 Cost): The affected creature gains +5 to Strength, +5 Grit, and +10 DR.

Haunting Touch (Power, +3 Cost) — Hollow
Requires the Boon Subject. Effects of this spell are not cleansable. Instead, they are removed from an affected creature when your thralls themselves are removed. Whenever your current host of Thralls is damaged, it loses 1 extra Presence.

Healing (Power, +6 Cost) — Universal
Raw Healing, Instant
Affected creatures regain HP equal to 2×Spirit. Incompatible with other Raw Healing effects.
Augment (2 Power, +6 Cost): Increase healing to 3×Spirit.

Healing, Unlimited (Power, +9+2X Cost) — Soul
Raw Healing, Instant
Affected creatures regain HP equal to Xd6+2×Spirit. Incompatible with other Raw Healing effects.
Augment (2 Power, +12+2X Cost): Increase healing to Xd6+3×Spirit.

In Their Thousands (2 Power, +1+X Cost) — Hollow
If this spell affects a creature attached to your thralls, increase the Presence of your active Thralls by 3+X after casting the spell, to a maximum equal to your level.
Augment (3 Power, +6): Instead of increasing by 3+X, set the presence of your active Thralls equal to your level.

Instability (Power, +6 Cost) — Fate, Pact
Crux, Harm, Instant
Requires a Range effect and a subject that creates a radius. Roll a d2. On a 2, the spell deals Spirit additional damage. On a 1, the spell targets your space.

Loan to the Moon (Power, +2 Cost) — Astral
Sequence
At the beginning of your next turn, regain 8 BP.
Augment (2 Power, +3 Cost): At the beginning of your next turn, regain 15 BP.

Misdirection (Power, +3 Cost) — Phantasm, Pact
Crux, Boon, Transient
When a strike is declared against an affected creature, the target may roll a d2. On a 2, the striker must choose a different target for the strike if another valid target is in range.

Corporeal Shadow (Power, +N Cost) — Shadow
Requires Place Shadow. Your Shadow has HP equal to N, an AC of 0 and is treated like an Allied Creature and may not be moved through. When it reaches 0 HP, it dies and is removed from the battlefield. At the start of each of your turns, your Shadow may take a major action as if it had the same character sheet as you, but shares your Boost Points and Mana.

Malignant Shadow (Power, +10 Cost) — Shadow
Harm
Affected creatures which are adjacent to your Shadow take Spirit additional damage.

Untold Power (Power, +0 Cost) — Pact
Deal, Harm
Benefit: Affected creatures take Spirit additional damage.
Delay Cost: Take damage equal to a fourth of your Maximum HP.
Close Cost: Take damage equal to three-fourths of your Maximum HP.

Renounce Power (Power, -4 Cost) — Arcane
No effect. You may take this effect multiple times.

Shatter (Power, +N Cost) — Elemental
Bane, Transient
Affected creatures suffer -N to their DR until the end of your next turn.

Spell Strike (2 Power, +1 Cost) — Universal
Harm, Sequence
Requires Touch. Before the cast action, make a melee strike against the target. This strike deals 2d6 damage on a hit, 3d6 damage on a critical hit and 1 damage on a glance.
Augment (3 Power, +10 Cost): Instead of making a strike that deals 2d6 or 1 damage, you may make a strike with a melee weapon you are holding.

Rapid Fire Surge (2 Power, -N Cost) — Fate
Crux, Sequence
Incompatible with other Sequence effects. N may not exceed 7. Resolve all other effects of this spell first. Roll Nd4. For every 4 rolled, cast this spell again (not including the Rapid Fire Surge effect). For every 1 rolled, you lose 3 of your highest base attribute which cannot be restored until the end of combat. If your BP reaches 0 or you have insufficient BP for all extra casts, you explode and die. This explosion deals Nd10+Spirit damage to every creature in a 2N block radius centered on you.
The DM is entitled to set a timer when you declare a spell with this effect. If you do not determine the final outcome before the timer counts 180 seconds, you explode and die.

Temper
Alter Fate (Temper, +6 Cost) — Fate
Boon, Clarity, Transient
The next time an affected creature would fall to 0 HP, it instead remains at 1 HP.

Artillery (Temper, +8 Cost) — Universal
Harm, Instant
Affected creatures more than 10 blocks away from you take Spirit additional damage.

Aversion (Temper, +10 Cost) — Phantasm
Boon, Transient
Affected creatures cannot be targeted by strikes or spells. A creature who boosts or deals damage is cleansed of this effect.
Augment (1 Temper, +5 Cost): Affected creatures cannot be targeted by strikes or spells from those who have your Illusion with an Intensity of 4 or greater.

Backlash (Temper, +6 Cost) — Fate
Crux, Harm, Instant
Roll a d2. On a 2, the spell deals Spirit additional damage. On a 1, you take Spirit damage from the spell.

Bargain (Temper, +20 Cost) — Pact
Crux
Choose one of your Deals. Roll a d6. On a 6, close that Deal without paying the cost. On a 1-3, you must pay to close that Deal or die.

Exchange of Favors (Temper, +2 Cost) — Pact
Deal
Benefit: Once per turn, at the end of this cast action, gain a Major action.
Delay Cost: Lose a major action.
Close Cost: Lose a major, minor and move action.

Pleasures of the Flesh (Temper, +N Cost) — Pact
Deal
Benefit: Affected creatures regain 3N HP.
Delay Cost: Every time you regain HP, you regain N less.
Close Cost: Every time you regain HP, you regain 2N less.

Riches Aplenty (Temper, +0 Cost) — Pact
Deal
Benefit: Gain a Potion worth 800 Lurcks or less.
Delay Cost: Disable one of your Enhancement Add-Ons.
Close Cost: You lose the effect of one of your Enhanced Items for the rest of combat.

Stopper Death (Temper, +5 Cost) — Pact
Deal
Benefit: You cannot die until the start of your next turn. This cannot spare you from a Deal.
Delay Cost: Half your Maximum BP or 5 BP, whichever is greater.
Close Cost: Die.

True Love (Temper, +0 Cost) — Pact
Deal
Benefit: Increase the attribute of a willing affected ally, other than you, by 5.
Delay Cost: That ally decreases their highest attribute by 2.
Close Cost: Decrease your highest attribute by 7.

Blast (Temper, +4 Cost) — Elemental
Harm, Instant
Requires a Radius effect. This spell deals 1d6 additional damage for every block of distance between an affected creature and the edge of the radius.

Blood of the Master (Temper, +0 Cost) — Hollow
Requires Conjure Thralls. When your Thralls are targeted, you may choose to be the target instead regardless of distance.

Blood Sacrifice (Temper, +N Cost) — Blood
Harm, Instant
Take 2N damage which cannot be reduced. Target takes 2N additional damage from the spell.
Augment (2 Temper, +0 Cost): Adds no cost.

Bloodied Fist (Temper, +8 Cost) — Blood
Harm, Sequence
Requires Touch. After the cast action, Bash the target.

Break Resolve (Temper, +8 Cost) — Phantasm
Bane, Conditional, Instant
The next time an affected creature uses an action to enter melee range of one of its enemies, it takes Spirit damage or ends its turn.
Augment (1 Temper, +8 Cost): The next time an affected creature that has your Illusion with an Intensity of 3 or greater uses an action to enter melee range of one of its enemies, it ends its turn. 

Cleanse (Temper, +1 Cost) — Arcane, Blood, Soul, Void
Instant
Cleanse all effects from affected creatures.

Cleanse, Precise (Temper, +4 Cost) — Arcane, Void
Instant
This spell must target a single creature. Cleanse any number of effects of your choice from the target.

Corona (Temper, +1 Cost) — Elemental
Area
Requires the Line or Free Line effect. Each affected creature on the line emits a 2-block radius. This spell also affects creatures within each radius.

Create Wall (Temper, +N Cost) — Elemental
This spell must have the Line, Free Line, or Snake effect. All unoccupied blocks affected by the spell are filled with a barrier. This barrier counts as terrain with height N/4, rounded up. The barrier can be targeted as if it is a creature occupying every affected block. It has 4×Spirit HP and 2N DR.
Augment (2 Temper, +3 Cost): The barrier has height 2 and DR equal to 2× your level.

Damage Over Time (Temper, +2 Cost) — Astral, Blood, Elemental, Rune, Soul, Void
Harm, Persistent
Each affected creature takes Spirit/2 damage at the beginning of each of its turns.
Augment (2 Temper, +2 Cost): This spell must target a single creature. Instead of taking Spirit/2 damage at start of turn, the target takes Spirit damage.

Disorient (Temper, +2N Cost) — Phantasm, Shadow
Bane, Persistent
Affected creatures suffer -N to hit.
Augment (2 Temper, +4 Cost): Affected creatures suffer -Spirit to hit.

Disrupt Spirit (Temper, +6 Cost) — Phantasm, Soul, Void
Bane, Persistent
When an affected creature boosts, it loses 1 BP.
Augment (2 Temper, +12 Cost): When an affected creature boosts, it loses BP equal to the cost of the boost.

Divest Temper (Temper, +0 Cost) — Universal
Add 1 Word to this spell’s Flourish phrase. You may take this effect multiple times.

Drain Vitality (Temper, +N Cost) — Blood, Void
Harm, Instant
Affected creatures may either take 2N damage or lose N BP.
Augment (2 Temper, +2 Cost): Affected creatures either take Spirit damage or lose Spirit/2 BP.

Echo Casting (Temper, +3 Cost) — Pact, Fate, Phantasm
Crux
Requires a Range effect and a subject that creates a radius. Roll a d2. On a 2, place a second radius within the same range. The spell also affects creatures within that radius.
Augment (2 Temper, +4 Cost): Roll a d3 instead of a d2. On a 3, Place a third radius.

Emptiness (Temper, +3X Cost) — Void
Persistent
All boosts targeting affected creatures are increased in cost by X.
Augment (2 Temper, +3 Cost): All boosts targeting affected creatures are increased in cost by 3.

Enclose (Temper, +N Cost) — Elemental, Rune
Requires a Radius effect. The radius is enclosed by a barrier at a height you choose. Creatures and blocks inside the radius at the same height as the barrier are considered inside the barrier. Targeting, vertical movement, and horizontal movement between the inside and outside of the barrier are blocked. The upper surface counts as terrain with height 1 greater than the barrier’s height. It can be targeted as if it is a creature occupying the entire radius. The barrier has 3xSpirit HP and N DR.
Augment (2 Temper, +3 Cost): The barrier has DR equal to your level.

Entangle (Temper, +2 Cost) — Hollow, Shadow
Bane, Persistent
Affected creatures always act as if they are in difficult terrain.

Evasion (Temper, +N Cost) — Pact, Fate, Shadow
Boon, Clarity, Persistent
Affected creatures gain +N AC.
Augment (2 Temper, +4 Cost): Affected creatures gain a bonus to AC equal to Spirit.

Flight (Temper, +1 Cost) — Arcane, Astral, Elemental, Pact, Void
Boon, Persistent
Affected creatures have either Flight 2 or increase their Flight by 1.

Foresight (Temper, +7 Cost) — Fate
Clarity, Persistent
Each affected creature may choose to turn an incoming hit into a glance. After a creature uses this effect, it cannot use the effect again until the beginning of its next turn.

Trait: Formless (Temper, +12 Cost) — Void
Requires Manifest Void. When your Void or any creature inside your Void is targeted by a strike, bash or cast, you may choose to be the target instead regardless of position or distance.

Freeze (Temper, +10 Cost) — Elemental
Bane, Transient
Affected creatures cannot move and take double damage from Bash. An affected creature is cleansed of this effect if it is targeted and damaged by an action after the spell is cast, or if it takes a major action.

Frugal Temper (Temper, -1 Cost) — Universal
No effect. You may take this effect multiple times.

Gift of the Spheres (Temper, +2 Cost) — Astral
Link, Persistent
Once per turn when an affected creature other than yourself uses a boost, you regain 1 BP.
Augment (2 Temper, +6 Cost): When an affected creature other than yourself uses a boost, you regain 1 BP.

Glamour (Temper, +4 Cost) — Pact
Boon, Persistent
Creatures affected by this spell count as an ally of all creatures for the purpose of powers that affect only allies
Augment (2 Temper, +4 Cost): Affected creatures also count as allies for the purpose of powers that affect only enemies.

Invisibility (Temper, +3 Cost) — Arcane, Pact, Phantasm, Shadow, Void
Boon, Persistent
Ranged strikes against affected creatures automatically glance. Their location is still known to combatants.
Augment (2 Temper, +4 Cost): Affected creatures cannot be targeted by strikes or cast actions unless they are adjacent to the creature making the strike or cast.

Iron Grip (Temper, +3 Cost) — Hollow
Bane, Persistent
Requires the Master’s Boon Subject. Affected creatures cannot move. Instead, they can spend one or more blocks of movement from a Run or Dash action to reduce the Thralls’ Presence by the same amount. They are cleansed of this effect when your Thralls are destroyed.
Augment (2 Temper, +4 Cost): Instead of reducing Presence by an amount equal to the movement spent, reduce Presence by 1 for every 2 blocks of movement spent.

Lifesteal (Temper, +8 Cost) — Blood, Hollow, Void
Link, Persistent
This spell must target a single creature. Before resolving this spell’s other effects, and at the start of each of your turns while the spell is in effect, you read the target’s HP. Each time you read the target’s HP in this way at the start of a turn, regain HP equal to 1/4 the amount by which the prior reading exceeds the new one.

Pierce (Temper, +2 Cost) — Astral, Blood, Shadow
Harm
Requires Line. Each creature on the line affected by this spell takes additional damage equal to Spirit/2 times the number of affected creatures on the line closer to you.

Protection (Temper, +2 Cost) — Void, Soul
Persistent
Affected creatures cannot receive cleansable effects.

Puppeteer (Temper, +3+X Cost) — Hollow, Phantasm, Rune, Shadow
Instant
This spell must target a single creature. The target immediately takes a Run action that you may choose to control. They gain +X Speed for the purpose of this action.
Augment (2 Temper, +4 Cost): Affected creatures instead gain +8 Speed for the purpose of this Run action.

Renounce Temper (Temper, -4 Cost) — Arcane
No effect. You may take this effect multiple times.

Rupture: Bathed in Blood (Temper, +0 Cost) — Blood
Conditional, Instant, Link, Rupture
Requires Blood Oath. If this spell causes the target to Rupture, you regain 2X BP. The Tithe required for this spell to cause a Rupture increases by 10X. If the target is dead but did not Rupture, you regain 2X BP.
If the target is cleansed of this spell’s Blood Oath effect before it causes a Rupture, the target is cleansed of this effect.

Rupture: Drink Life (Temper, +6 Cost) — Blood
Conditional, Link, Rupture, Transient
Requires Blood Oath. If this spell causes the target to Rupture, you regain 8X HP. If the target is dead but did not Rupture, you regain 4X HP.
If the target is cleansed of this spell’s Blood Oath effect before it causes a Rupture, the target is cleansed of this effect.

Rupture: Tear Out the Heart (Temper, +5X Cost) — Blood
Bane, Rupture, Persistent
Requires Blood Oath. If this spell causes the target to Rupture, its Grit is reduced by X. The Tithe required for this spell to cause a Rupture increases by 2X.
If the target is cleansed of this spell’s Blood Oath effect before it causes a Rupture, the target is cleansed of this effect.

Rupture: Visceral Rupture (Temper, +5 Cost) — Blood
Conditional, Harm, Instant, Rupture
Requires Blood Oath. If this spell causes the target to Rupture, it takes Spirit additional damage. The Tithe required for this spell to cause a Rupture increases by 5X.
If the target is cleansed of this spell’s Blood Oath effect before it causes a Rupture, the target is cleansed of this effect.

Place Shadow (Temper, +2 Cost) — Shadow
Place your Shadow on an affected and unoccupied block. You may only have 1 Shadow at a time. Creatures can move through your Shadow but cannot end any action on top of it.

Shade Shift (Temper, +4 Cost) — Shadow
Instant
Requires a Range effect. Each affected grounded creature appears on a block of your choice within range of you, ignoring all obstacles. An affected creature may choose to take Spirit damage instead of appearing.

Shield of Thralls (Temper, +4 Cost) — Hollow
Requires Conjure Thralls. When a strike is made against an ally to whom your Thralls are attached, the damage of the strike is reduced by double the Thralls’ Presence and your Thralls lose 1 Presence. When your Thralls are damaged, they lose 2 extra Presence.

Slow (Temper, X Cost) — Elemental, Rune, Shadow
Bane, Persistent
Affected creatures suffer -X to their Speed.
Augment (2 Temper, +4 Cost): Affected creatures suffer -10 to their speed.

True Strike (Temper, +N Cost) — Fate, Soul
Boon, Clarity, Persistent
Affected creatures gain +N to hit.
Augment (2 Temper, +4 Cost): Affected creatures gain a bonus to hit equal to Spirit.

Vicious Thralls (Temper, +2 Cost) — Hollow
Requires Conjure Thralls. If an enemy damages an adjacent attached creature, the enemy takes damage equal to the Thralls' Presence. When your Thralls are damaged, they lose 1 extra Presence.

Vulnerability (Temper, +X Cost) — Shadow, Soul, Phantasm, Hollow
Bane, Persistent
Affected creatures suffer -X to AC.
Augment (2 Temper, +4 Cost): Affected creatures suffer -Spirit to AC.

Flourish
Aegis (Flourish, +1 Cost) — Soul
Requires Aura. Increase the Radius by 1. Any persistent effects of the spell affect only your allies.

Agility Casting (Flourish, +0 Cost) — Pact, Shadow
If any effects of this spell reference Spirit to determine their outcome, you may use your Agility score instead.

Aneurysm (Flourish, +0 Cost) — Phantasm
Harm, Instant
If the remaining health of any affected creature is less than your Spirit after you cast this spell, it drops to 0 HP.
Augment (2 Power, +10 Cost): If any affected creature has your Illusion with an Intensity of 5 or greater, they drop to 0 HP.

Appear (Flourish, +1 Cost) — Arcane, Pact, Shadow
Sequence
Before or after casting the spell, you appear in any unoccupied block targeted or affected by the spell.
Augment (2 Flourish, +2 Cost): Your selected block can be occupied by an enemy. If it is, both you and the enemy take Spirit damage and your new selected block is an adjacent block. You cannot damage an enemy in this way more than once in a single cast.

Burn at Both Ends (Flourish, -X Cost) — Blood, Hollow, Soul
Take 8X damage which cannot be reduced.

Call of the Void (Flourish, +5 Cost) — Void
Harm, Instant
Affected creatures take Spirit damage instantly and Spirit damage at the start of each of their turns. An affected creature may immediately teleport to any unoccupied space inside your Void and negate the damage from this effect. If you do not have an active Void, this negation occurs automatically.

Chaotic Blast (Flourish, +0 Cost) — Fate
Crux
Requires a Radius effect. Roll a d3 before casting. On a 3, the base radius of the Radius effect is doubled. On a 2, the radius does not change. On a 1, the radius is reduced to 1.

Charged Spell (Flourish, +0 Cost) — Astral, Fate
Clarity, Sequence
This spell must have a Raw Damage or Raw Healing effect. The effects of this spell occur at the end of your turn N rounds after casting. Add N×Spirit damage or healing to the spell. Incompatible with other Sequence effects.

Cinders (Flourish, +2 Cost) — Elemental
Harm, Transient
Requires an Area effect. Each affected creature takes Spirit/2 damage at the end of its next turn unless it first leaves the area affected by the spell.

Command (Flourish, +2 Cost) — Hollow
If you have active Thralls, they attach to all affected creatures.

Crash (Flourish, +5X Cost) — Elemental
Harm, Instant
All affected creatures move up to 5X blocks in a straight line in one direction of your choice. If an affected creature encounters an obstacle before moving the full distance, it takes Xd6 damage and the movement is interrupted. If an affected creature encounters another creature before moving the full distance, both creatures take Xd6 damage and the movement is interrupted.

Debt to the Sun (Flourish, +2 Cost) — Astral
Sequence
You may fall below 0 BP by casting this spell, as long as its cost does not exceed your maximum BP. Record the amount by which the cost exceeded your current BP. If your BP is still negative at the start of your next turn, take damage equal to five times that amount at the start of that turn and each of your turns thereafter. This is not cleansable, cannot be reduced, and stacks with itself.

Domain Wall (Flourish, -4 Cost) — Void
Conditional, Sequence
Requires Void Current. This spell can be cast as a minor action. Whenever an affected creature would move out of your void, they may instead choose to immediately stop. Instead of taking effect immediately, this spell takes effect on who use movement to leave your Void.

Expansion (Flourish, +1 Cost) — Void
Requires Void Current. The Size of the Void increases by 1.
Augment (3 Flourish, +4 Cost): The Size of the Void increases by 2.

False Body (Flourish, +2 Cost) — Pact, Phantasm
Boon, Crux, Transient
Affected creatures roll a d2 each time they are dealt damage. On a 2, they take no damage and are cleansed of this effect.

Flow (Flourish, +0 Cost) — Elemental
Instant
After casting this spell, move up to 5 blocks.

From on High (Flourish, +1  Cost) — Astral
Requires an Area effect. This spell affects creatures regardless of their height.

Frugal Flourish (2 Flourish, -1 Cost) — Universal
No effect. You may take this effect multiple times.

Fulminate (Flourish, +2 Cost) — Rune
This spell must have a Rune effect and either a Raw Healing or Raw Damage effect. At the start of each of your turns before the Rune triggers, the healing or damage of the spell is increased by Spirit/2.

Gather Clarity (Flourish, +0 Cost) — Fate
Sequence
Requires a Clarity effect. After casting this spell, gain 1 Clarity. Each time you roll a 1 when determining the outcome for a Crux effect in this spell, gain 1 additional Clarity if that result remains unaltered. After you roll a die to determine the outcome of any Crux effect, you may spend 2 Clarity to increase the result by 1. You may not exceed the maximum roll of the die.

Gather Crux (Flourish, +0 Cost) — Fate
Sequence
Requires a Crux effect. After casting this spell, gain 1 Crux. Each time you roll a 1 when determining the outcome for a Crux effect in this spell, gain 1 additional Crux if that result remains unaltered. After you roll a die to determine the outcome of any Crux effect, you may spend 2 Crux to reroll the die.

Gaze (Flourish, +1  Cost) — Universal
This spell must target a single creature. At the start of your turns after targeting a creature with this spell, you may designate a different creature within the spell's range to be the new target. All persistent effects of the spell are placed on the new target and cleansed from the last target.

Grit Casting (Flourish, +0  Cost) — Blood, Fate
If any effects of this spell reference Spirit to determine their outcome, you may use your Grit score instead.

Guidance (Flourish, +1 Cost) — Fate
Boon, Clarity, Persistent
Each affected creature may reroll any die. After a creature uses this effect, it cannot use the effect again until the beginning of its next turn.

Insight (Flourish, +3 Cost) — Fate
Clarity, Persistent
This spell must target a single creature. You learn its attributes. While the target is under this effect, you may learn any number of its attributes at the start of each of your turns.

Instill Illusion (Flourish, +2 Cost) — Phantasm
You plant your Illusion in the target with an Intensity of 1. If you have already planted an Illusion in the target, its Intensity increases by 1. When cleansed, the Illusion loses 2 Intensity. An Illusion with 0 Intensity is destroyed. An illusion can only be increased by a maximum of 2 per round.

Linger (Flourish, +0 Cost) — Universal
Requires an Area effect. Any persistent effects of this spell linger in the area of effect. They are removed from creatures that leave the area and applied to creatures that enter. The effects of the spell are not cleansable.

Omen (Flourish, +4 Cost) — Fate
Bane, Clarity, Conditional
The next time an affected creature rolls a d20, the result is treated as a 1.

Pact with the Void (Flourish, -2 Cost) — Astral, Pact, Void
This spell can have a cost of 0 BP. Your current BP is set to 0 after casting this spell. If this caused your BP to increase, you may no longer cast spells in this combat.

Palanquin (Flourish, +1 Cost) — Hollow
Boon, Persistent
Requires Conjure Thralls. Attached allies gain a bonus to their movement speed equal to the Presence of your Thralls.

Trait: Creep (Flourish, +2 Cost) — Void
Requires Manifest Void. When you end your turn, the Size of the Void increases by 1.

Trait: Devour (Flourish, +3 Cost) — Void
Requires Manifest Void. When a creature dies inside the Void, the Size of the Void increases by 2.

Trait: Hardening (Flourish, +3 Cost) — Void
Requires Manifest Void. Your Void has DR equal to 3 times its size.

Trait: Lysis (Flourish, +3 Cost) — Void
Requires Manifest Void. The maximum HP of your Void is Spirit instead of Size×Spirit. Instead of being destroyed if it is reduced to 0 HP, the Void is restored to maximum HP and its Size decreases by 1. The Void is destroyed if its Size reaches 0.

Trait: Palm of My Hand (Flourish, +1 Cost) — Void
Requires Manifest Void. Each creature inside the Void is considered adjacent to all others for all purposes regardless of distance or height.

Trait: Protective Void (Flourish, +8 Cost) — Void
Requires Manifest Void. When a creature glances against you while you are inside the Void, you may cause the strike to target and glance against the Void instead.

Trait: Suffocating Void (Flourish, +5 Cost) — Void
When your Void is targeted and damaged by an action, you may inflict half as much damage to all creatures inside and reduce the damage dealt to the Void by half.

Quickening (5 Flourish, +4 Cost) — Arcane
If you cast this spell as a Major Action on your turn, you may cast one spell with the Quickening effect on the same turn using a Minor Action.

Reconstruct (Flourish, +3 Cost) — Void
Requires Manifest Void. If you already have an active Void, the new Void you create immediately changes in Size to match the previous one.

Rupture: Explosive Rupture (Flourish, +1 Cost) — Blood
Rupture
Requires Blood Oath. If this spell causes the target to Rupture, any damage dealt to the target by the rupture is also dealt to creatures within a 2-block radius of the target.
Augment (Flourish, +3 Cost): Increase the radius to 4 blocks.

Sacrifice (Flourish, -N Cost) — Hollow
Before casting this spell, detach your Thralls from any N attached creatures.

Shifting Currents (Flourish, +2 Cost) — Elemental
Requires an effect that is Harm and Instant. Deal Spirit additional damage with this spell if you have not cast a spell with a Harm effect during or after your last turn.

Soul Burn (Flourish, +0 Cost) — Universal
You may take any amount of damage after casting this spell.

Spirit Away (Flourish, +1 Cost) — Pact, Shadow
Sequence
When you Run or Dash while adjacent to a creature affected by this spell, you may cause that creature to appear in any unoccupied space adjacent to you after the action resolves.

Spirit Tithe (Flourish, +1 Cost) — Soul
Lose X BP. Affected creatures other than yourself regain X BP.

Steal Magick (Flourish, +1 Cost) — Arcane, Pact, Void
Requires the Cleanse or Precise Cleanse effect. Give yourself an effect of your choice cleansed by this spell.

Knowledge Unbound (Flourish, +3 Cost) — Pact
Deal
Benefit: Select an affected enemy and you learn their character sheet.
Delay Cost: Forget a spell for the rest of combat.
Close Cost: Forget the Cast boost.

Strength Casting (Flourish, +0 Cost) — Soul, Void
If any effects of this spell reference Spirit to determine their outcome, you may use your Strength score instead.

Strength of Many (Flourish, +0 Cost) — Hollow
If any effects of this spell reference Spirit to determine their outcome, use 2 times the Presence of your active Thralls instead.

Swap (Flourish, +2 Cost) — Shadow
You may cause each affected creature to switch places with either you or a different affected creature.

Tainted Blood (Flourish, +5 Cost) — Blood
All Link effects in this spell are non-cleansable.

Tap Life (Flourish, +1 Cost) — Blood
Sequence
Take any amount of damage after casting this spell. For every 5 damage taken in this way, regain 1 BP. You may not regain an amount of BP greater than the cost of this spell.

Tithe to the Stars (Wordless, -5 Cost) — Astral
Take a -1 penalty to your highest current base attribute when you cast this spell. This penalty is cumulative and cannot be cleansed.

Torn Apart (1 Power, +0 Cost) — Blood
Harm, Instant
This spell must target a single creature. This spell deals additional damage equal to the difference between your current HP and maximum HP. After casting this spell, you die.

Trigger: Action (2 Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following condition: Any creature has taken a specific action of your choice while marked by this Rune.

Trigger: Boost (Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: Any creature has used a specific Boost of your choice while marked by this Rune.

Trigger: Tripwire (2 Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: Any creature has moved while marked by this Rune.

Trigger: Ailment (2 Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: Any marked creature is under a specific persistent effect of your choice.

Trigger: Timer (Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: The caster has ended their turn at least 3 times since placing this Rune.

Trigger: Carnage (Flourish, +0 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: At least a chosen number of creatures have died while marked by this Rune.

Trigger: Allied Presence (Flourish, +0 Cost) — Rune
This spell must have the Magick Circle effect. Adds the following Trigger statement: At least a chosen number of living living allies (including the caster) are present in the Rune's area.

Trigger: Enemy Presence (Flourish, +0 Cost) — Rune
This spell must have the Magick Circle effect. Adds the following Trigger statement: At least a chosen number of living enemies are present in the Rune's area.

Twin Bolts (Flourish, +2 Cost) — Elemental
Requires Line. Place a second line extending to another block within range. A creature can be affected only once by this spell even if it is on both lines.

Unstoppable (Flourish, +X Cost) — Blood, Phantasm, Void
When dealing damage to an affected creature, the effects of this spell ignore the first 5X points of the creature’s Damage Reduction.

Verbose Power (2 Flourish, +0 Cost) — Universal
Add 1 Word to your spell’s Power. You may take this effect multiple times.

Verbose Subject (2 Flourish, +0 Cost) — Universal
Add 1 Word to your spell’s Subject phrase. You may take this effect multiple times.

Verbose Temper (2 Flourish, +0 Cost) — Universal
Add 1 Word to your spell’s Temper phrase. You may take this effect multiple times.

Voice of the Master (Flourish, +1 Cost) — Hollow
You may cast this spell as if you are occupying the space of any creature to which your Thralls are attached.

Widen Spell (Flourish, -1 Cost) — Elemental
Requires a Radius effect. The size of the radius is increased by 2.

Wild Magick (Flourish, +4 Cost) — Fate
Roll 2d6. The order of the dice does not matter. Consult the table below for the result of each combination. Effects that reference a radius can affect a 5 block radius centered on you. This is a Crux effect.

Wildfire (Power, +3 Cost) — Elemental
Harm
After you cast this spell for the first time on your turn, gain 1 Conflagration. When you cast this spell for the first time on your turn, it deals additional damage equal to Spirit/2 times your Conflagration. If you end your turn without having cast a spell with this effect during the turn, lose all Conflagration.

Wordless
Casting Tool, 1-Handed (Wordless, -1 Cost) — Universal
Add 1 Word to your Flourish. You must have one hand occupied with a casting tool to cast this spell.

Casting Tool, 2-Handed (Wordless, -2 Cost) — Universal
Add 1 Word to your Flourish. You must have two hands occupied with a casting tool to cast this spell.
Augment (Wordless, -1 Cost): Add 1 Word to your Subject instead of your Flourish.

Imbue Rune (Wordless, Cost -1) — Rune
Taking this effect adds 2 Words to your Flourish. This spell marks affected creatures with a Rune. You must take one, two, or three Trigger effects. Instead of taking effect immediately, the spell is activated when all of its Trigger statements are true. The spell has no effect if any of the Trigger statements are already true at the time of casting. All choices for Trigger statements must be declared when the spell is cast.

Latent Power (Wordless) — Universal
If any effects of this spell reference Spirit to determine their outcome, you may use your level instead.

Magick Circle (Wordless, +0 Cost) — Rune
This spell must have the Imbue Rune effect and an Area effect. Rather than marking the affected creatures, the spell marks its area of effect with a Rune. All creatures inside the area are affected by the spell when the Rune is triggered. All creatures inside the area before it is triggered are considered 'marked' for the purpose of Trigger effects.

Shadow Walk (Wordless, +0 Cost) — Shadow
After this spell is cast, you may swap the position of yourself and your Shadow.

Parataxis (Wordless, +7 Cost) — Arcane
Add 2 words to your Flourish.

Superior Casting Tool (Wordless, +0 Cost) — Arcane
Add 1 Word to your Flourish. You must have one or two hands occupied with a casting tool to cast this spell.

Trigger: Recursion (Wordless, -1 Cost) — Rune
This spell must have the Imbue Rune effect. Adds the following Trigger statement: Any creature has been affected by the activation of a Rune while marked by this Rune.`;

  function normalizeAspects(aspectsText) {
    const raw = String(aspectsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s === "Fae" ? "Pact" : s));
    if (!raw.length) return { universal: true, aspects: [] };
    if (raw.length === 1 && raw[0] === "Universal") return { universal: true, aspects: [] };
    return { universal: false, aspects: raw };
  }

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function parseWordCost(wordPart) {
    const p = String(wordPart || "").trim();
    const z = { subjectCost: 0, powerCost: 0, temperCost: 0, flourishCost: 0 };
    if (!p) return z;
    if (/wordless/i.test(p)) return z;
    const m = p.match(/^\s*(\d+)\s*(Subject|Power|Temper|Flourish)\s*$/i);
    if (m) {
      const n = clampInt(m[1], 0, 99);
      const k = m[2].toLowerCase();
      z[`${k}Cost`] = n;
      return z;
    }
    const m2 = p.match(/^\s*(Subject|Power|Temper|Flourish)\s*$/i);
    if (m2) {
      const k = m2[1].toLowerCase();
      z[`${k}Cost`] = 1;
      return z;
    }
    // fallback: handle "1 Power" / "2 Flourish" etc with weird spacing
    const m3 = p.match(/(\d+)\s*(Subject|Power|Temper|Flourish)/i);
    if (m3) {
      const n = clampInt(m3[1], 0, 99);
      const k = m3[2].toLowerCase();
      z[`${k}Cost`] = n;
    }
    return z;
  }

  function parseCostExpr(costExpr) {
    // Supports: +3, -4, +2N, -N, +X, 1+3X, +3+3X, Cost -1, Cost +X, X
    let s = String(costExpr || "").toUpperCase().replace(/\s+/g, "");
    s = s.replace(/^COST/, "");
    s = s.replace(/COST$/, "");
    s = s.replace(/\+COST/g, "");
    s = s.replace(/COST\+/g, "+");
    s = s.replace(/COST-/g, "-");
    // normalize: if starts with "X" or "N" treat as +X/+N
    if (/^[NX]/.test(s)) s = `+${s}`;
    // normalize: if starts with a number treat as +<number>
    if (/^\d/.test(s)) s = `+${s}`;

    let bpCost = 0;
    let nCostPerUnit = 0;
    let xCostPerUnit = 0;

    // split into terms like +3, -2N, +3X
    const termRe = /([+-])(\d+)?([NX])?/g;
    let any = false;
    let m;
    while ((m = termRe.exec(s))) {
      any = true;
      const sign = m[1] === "-" ? -1 : 1;
      const num = m[2] ? Number(m[2]) : 1;
      const v = m[3] || "";
      if (!v) bpCost += sign * num;
      else if (v === "N") nCostPerUnit += sign * num;
      else if (v === "X") xCostPerUnit += sign * num;
    }
    if (!any) bpCost = 0;

    return { bpCost, nCostPerUnit, xCostPerUnit };
  }

  function looksLikeTagsLine(line) {
    const s = String(line || "").trim();
    if (!s) return false;
    if (s.length > 60) return false;
    if (s.includes(".")) return false;
    if (/^This\b/i.test(s)) return false;
    if (/^Requires\b/i.test(s)) return false;
    return /^[A-Za-z0-9:,\s-]+$/.test(s);
  }

  function detectAdds(desc) {
    const d = String(desc || "");
    const adds = { addSubject: 0, addPower: 0, addTemper: 0, addFlourish: 0 };
    // Examples we want to catch:
    // - "Add 1 Word to your Flourish."
    // - "Add 1 Word to your spell’s Subject phrase."
    // - "Add 2 Words to this spell's Temper"
    const r =
      /Add\s+(\d+)\s+Words?\s+to\s+(?:your\s+spell[’']s|this\s+spell[’']s|this\s+spell's|your)\s+(Subject|Power|Temper|Flourish)/gi;
    let m;
    while ((m = r.exec(d))) {
      const n = clampInt(m[1], 0, 99);
      const k = m[2].toLowerCase();
      adds[`add${k[0].toUpperCase()}${k.slice(1)}`] += n;
    }
    const r2 = /Taking this effect adds\s+(\d+)\s+Words?\s+to\s+your\s+(Flourish|Subject|Power|Temper)/gi;
    while ((m = r2.exec(d))) {
      const n = clampInt(m[1], 0, 99);
      const k = m[2].toLowerCase();
      adds[`add${k[0].toUpperCase()}${k.slice(1)}`] += n;
    }
    return adds;
  }

  function parse() {
    const lines = RAW.split(/\r?\n/);
    /** @type {any[]} */
    const defs = [];
    /** @type {Record<string, number>} */
    const idCounts = {};
    let section = "";
    let current = null;
    let currentTags = [];
    let currentAspects = { universal: false, aspects: [] };
    let currentHeaderAspectsText = "";
    let currentTitle = "";
    let orderCounter = 0;

    function pushCurrent() {
      if (!current) return;
      // infer stackable
      if (/may take this effect multiple times\b/i.test(current.desc || "")) current.stackable = true;
      // infer adds
      const adds = detectAdds(current.desc || "");
      // Fallback special-cases (keeps behavior stable even if wording changes)
      const nm = String(current.name || "").toLowerCase();
      if (adds.addPower === 0 && adds.addSubject === 0 && adds.addTemper === 0 && adds.addFlourish === 0) {
        if (nm.startsWith("verbose power")) adds.addPower = 1;
        if (nm.startsWith("verbose subject")) adds.addSubject = 1;
        if (nm.startsWith("verbose temper")) adds.addTemper = 1;
      }
      Object.assign(current, adds);
      // infer short description
      current.shortDesc = makeShortDesc(current.desc || "");

      const baseId = slugify(current.name) || `effect-${defs.length + 1}`;
      const n = (idCounts[baseId] = (idCounts[baseId] ?? 0) + 1);
      current.id = n === 1 ? baseId : `${baseId}-${n}`;
      defs.push(current);
      current = null;
      currentTags = [];
      currentAspects = { universal: false, aspects: [] };
    }

    function startEffect(headerLine, parsed) {
      pushCurrent();
      // Sentence priority: Subject, Power, Temper, Flourish, Wordless (written first -> last)
      const priorityBase =
        section === "Subject"
          ? 10
          : section === "Power"
            ? 20
            : section === "Temper"
              ? 30
              : section === "Flourish"
                ? 40
                : 50; // Wordless/other
      currentAspects = parsed.aspectsInfo;
      currentTags = [];
      currentTitle = parsed.title || "";
      currentHeaderAspectsText = parsed.aspectsText || "";
      current = {
        id: "",
        name: headerLine.trim(),
        aspect: null,
        aspects: parsed.aspectsInfo.aspects,
        universal: parsed.aspectsInfo.universal,
        tokenCost: parsed.aspectsInfo.universal ? 0 : 1,
        bpCost: parsed.cost.bpCost,
        nCostPerUnit: parsed.cost.nCostPerUnit !== 0 ? parsed.cost.nCostPerUnit : undefined,
        xCostPerUnit: parsed.cost.xCostPerUnit !== 0 ? parsed.cost.xCostPerUnit : undefined,
        nVar: parsed.cost.nCostPerUnit !== 0 ? true : undefined,
        xVar: parsed.cost.xCostPerUnit !== 0 ? true : undefined,
        tags: [],
        priority: priorityBase,
        order: orderCounter++,
        desc: "",
        ...parsed.words,
      };
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = String(raw || "").trimEnd();
      const s = line.trim();
      if (!s) {
        // blank line ends tag capture but not description
        if (current && currentTags.length && !current.tags.length) current.tags = currentTags.slice();
        continue;
      }

      // section headings
      if (/^(Subject|Power|Temper|Flourish|Wordless)\s*$/i.test(s)) {
        pushCurrent();
        section = s[0].toUpperCase() + s.slice(1).toLowerCase();
        continue;
      }

      // Effect header: "... (.., .. Cost) — Aspects"
      let m = s.match(/^(.+?)\s*\((.+?)\)\s*[—-]\s*(.+)\s*$/);
      if (!m) {
        // header without aspects: "... (.., .. Cost)"
        m = s.match(/^(.+?)\s*\((.+?)\)\s*$/);
      }
      if (m) {
        const headerName = m[1].trim();
        const paren = m[2].trim();
        const aspectsText = m[3] ? m[3].trim() : "";

        // Parse "(word, cost)" where cost can be "Cost +X" etc.
        const parts = paren.split(",").map((p) => p.trim()).filter(Boolean);
        const wordPart = parts.find((p) => /Subject|Power|Temper|Flourish|Wordless/i.test(p)) || parts[0] || "";
        const costPart =
          parts.find((p) => p !== wordPart && /Cost/i.test(p)) ||
          parts.find((p) => p !== wordPart && /[NX]/i.test(p)) ||
          parts.find((p) => p !== wordPart && /[+-]?\d/i.test(p)) ||
          parts[1] ||
          "";

        const words = parseWordCost(wordPart);
        const cost = parseCostExpr(costPart);
        const aspectsInfo = normalizeAspects(aspectsText);

        startEffect(s, { words, cost, aspectsInfo, title: headerName, aspectsText });
        continue;
      }

      // Augment lines become separate selectable effects
      if (/^Augment\s*\(/i.test(s)) {
        const aug = s;
        // Example: "Augment (2 Subject, +2 Cost): blah"
        const am = aug.match(/^Augment\s*\((.+?)\)\s*:\s*(.*)$/i);
        if (am) {
          const paren = am[1].trim();
          const desc = am[2].trim();
          const parts = paren.split(",").map((p) => p.trim()).filter(Boolean);
          const wordPart = parts.find((p) => /Subject|Power|Temper|Flourish|Wordless/i.test(p)) || parts[0] || "";
          const costPart =
            parts.find((p) => p !== wordPart && /Cost/i.test(p)) ||
            parts.find((p) => p !== wordPart && /[NX]/i.test(p)) ||
            parts.find((p) => p !== wordPart && /[+-]?\d/i.test(p)) ||
            parts[1] ||
            "";
          const words = parseWordCost(wordPart);
          const cost = parseCostExpr(costPart);

          // Attach to current effect's aspects/universal (if any); otherwise universal.
          const aspectsInfo = current ? currentAspects : { universal: true, aspects: [] };
          const parentTitle = currentTitle || (current?.name ? String(current.name).split("(")[0].trim() : "Effect");
          const parentAspectsText = currentHeaderAspectsText || (aspectsInfo.universal ? "Universal" : aspectsInfo.aspects.join(", "));
          const headerLine = `Augment ${parentTitle} (${paren}) — ${parentAspectsText}`.trim();
          startEffect(headerLine, { words, cost, aspectsInfo, title: `Augment ${parentTitle}`, aspectsText: parentAspectsText });
          // Augment inherits the base effect's tags if available.
          const inheritedTags =
            current && Array.isArray(current.tags) && current.tags.length
              ? current.tags.slice()
              : currentTags && currentTags.length
                ? currentTags.slice()
                : [];
          current.desc = desc;
          current.tags = inheritedTags;
          // keep inherited tags; do not parse a new tag line for augment
          pushCurrent();
        }
        continue;
      }

      // Tag line (first non-empty line after header, if it looks like tags)
      if (current && !current.tags.length && !current.desc && looksLikeTagsLine(s)) {
        currentTags = s.split(",").map((x) => x.trim()).filter(Boolean);
        continue;
      }

      // description
      if (current) {
        const piece = s;
        current.desc = current.desc ? `${current.desc}\n${piece}` : piece;
      }
    }
    pushCurrent();
    return defs;
  }

  const defs = parse();
  return { All: defs };
})();

const WORD_BUDGET = Object.freeze({
  subject: 2,
  power: 2,
  temper: 2,
  flourish: 2,
});

function getWordCosts(def) {
  return {
    subject: clampInt(def?.subjectCost ?? 0, 0, 99),
    power: clampInt(def?.powerCost ?? 0, 0, 99),
    temper: clampInt(def?.temperCost ?? 0, 0, 99),
    flourish: clampInt(def?.flourishCost ?? 0, 0, 99),
  };
}

function wordTypeRank(def) {
  const wc = getWordCosts(def);
  // Order: Subject, Power, Temper, Flourish, Wordless
  if (wc.subject > 0) return 0;
  if (wc.power > 0) return 1;
  if (wc.temper > 0) return 2;
  if (wc.flourish > 0) return 3;
  return 4; // wordless
}

function getWordAdds(def) {
  return {
    subject: clampInt(def?.addSubject ?? 0, -99, 99),
    power: clampInt(def?.addPower ?? 0, -99, 99),
    temper: clampInt(def?.addTemper ?? 0, -99, 99),
    flourish: clampInt(def?.addFlourish ?? 0, -99, 99),
  };
}

function clampInt(v, min, max) {
  const n = Number.parseInt(String(v), 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function compactJson(obj) {
  return JSON.stringify(obj);
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function uniq(arr) {
  return [...new Set(arr)];
}

function signed(n) {
  const v = Number(n) || 0;
  return v > 0 ? `+${v}` : `${v}`;
}

function makeShortDesc(desc) {
  // Goal: keep the meaning, but compress aggressively using shorthand/casual phrasing.
  // We do NOT just take the first sentence; we keep all major clauses.
  const raw = String(desc || "").trim();
  if (!raw) return "";

  const normalize = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const abbrev = (s) => {
    let t = normalize(s);

    // Common phrase contractions / shorthand
    t = t.replace(/\bThis spell\b/gi, "Spell");
    t = t.replace(/\bThe spell\b/gi, "Spell");
    t = t.replace(/\bAffected creatures\b/gi, "Targets");
    t = t.replace(/\bAffected creature\b/gi, "Target");
    t = t.replace(/\bAffected blocks\b/gi, "Blocks");
    t = t.replace(/\bblocks?\b/gi, "bl");
    t = t.replace(/\bwithin (?:its|the) range\b/gi, "in rng");
    t = t.replace(/\bwithin range\b/gi, "in rng");
    t = t.replace(/\bcentered on\b/gi, "centered @");
    t = t.replace(/\bcentered on your space\b/gi, "centered @ you");
    t = t.replace(/\bcentered on the targeted block\b/gi, "centered @ target bl");
    t = t.replace(/\b1-block\b/gi, "1bl");
    t = t.replace(/\b2-block\b/gi, "2bl");
    t = t.replace(/\b3-block\b/gi, "3bl");
    t = t.replace(/\b4-block\b/gi, "4bl");
    t = t.replace(/\b5-block\b/gi, "5bl");

    // Requirements / incompatibilities
    t = t.replace(/\bRequires\b/gi, "Req:");
    t = t.replace(/\bIncompatible with\b/gi, "No w/");
    t = t.replace(/\bThis spell must\b/gi, "Must");
    t = t.replace(/\bSpell must\b/gi, "Must");
    t = t.replace(/\bUnder no circumstances can you\b/gi, "You can’t ever");
    t = t.replace(/\bYou may choose to not be affected\b/gi, "Caster can opt out");
    t = t.replace(/\bYou may choose to be affected\b/gi, "Caster may opt in");
    t = t.replace(/\bYou may exclude yourself and your allies\b/gi, "You+allies can be excluded");

    // Time phrasing
    t = t.replace(/\bAt the beginning of each of (?:its|their) turns\b/gi, "each turn start");
    t = t.replace(/\bAt the end of your turn\b/gi, "end of your turn");
    t = t.replace(/\bAt the beginning of your next turn\b/gi, "next turn start");

    // Light punctuation cleanup
    t = t.replace(/\s*;\s*/g, "; ");
    t = t.replace(/\s*,\s*/g, ", ");
    t = t.replace(/\s+\.\s*/g, ". ");
    t = t.replace(/\s+:\s*/g, ": ");
    return t.trim();
  };

  // Keep line structure, but compress each line heavily, then join.
  const lines = raw
    .split(/\r?\n+/)
    .map((l) => abbrev(l))
    .filter(Boolean);

  // Further compress: turn long multi-sentence lines into short clauses.
  const clauses = [];
  for (const line of lines) {
    // Split on sentence endings, keep content.
    const parts = line.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      // Drop extremely redundant starters
      let c = p.replace(/^Spell\s+/i, "Spell ").trim();
      c = c.replace(/^Spell\s+/, ""); // often redundant in short mode
      c = c.replace(/^The\s+/i, "");
      clauses.push(c);
    }
  }

  // Join with separators; keep it readable but compact.
  let out = clauses.join(" / ");
  out = out.replace(/\s+\/\s+/g, " / ");
  out = out.replace(/\s{2,}/g, " ").trim();

  // Avoid runaway length in the UI; still keep "full meaning" by only trimming when absurdly long.
  if (out.length > 520) out = `${out.slice(0, 517)}…`;
  return out;
}

function formatSpellCost(bp, nCost, xCost) {
  const bpN = Number(bp) || 0;
  const nN = Number(nCost) || 0;
  const xN = Number(xCost) || 0;
  const total = bpN + nN + xN;

  // If N/X contribute nothing, just show the base BP.
  if (nN === 0 && xN === 0) return String(bpN);

  const term = (v) => (v === 0 ? "" : v > 0 ? `+${v}` : `${v}`);
  const expr = `${bpN}${term(nN)}${term(xN)}`;
  return `${total} (${expr})`;
}

// NOTE: cost suffix formatting intentionally unused now because effect names are
// stored exactly as authored (including costs/aspects) in the raw list.

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: #${id}`);
  return node;
}

/** Application state */
const state = {
  version: 1,
  // Aspects (rows) define what tokens exist to be spent.
  aspectRows: /** @type {{rowId: string, aspect: string|null, tokens: number}[]} */ ([]),
  // Spell-wide variables (declared once)
  spellVars: /** @type {{n: number, x: number}} */ ({ n: 0, x: 0 }),
  // Selected effect instances (stacking supported where appropriate)
  effectInstances:
    /** @type {{instanceId: string, defId: string, variant?: string, a?: string}[]} */ ([]),
  // Freeform tags (from effects) + future extension
  extraTags: /** @type {string[]} */ ([]),
  ui: /** @type {{filterAspect: string, textMode: "detailed"|"short"}} */ ({ filterAspect: "all", textMode: "detailed" }),
};

function newRowId() {
  return `row_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function resetState() {
  state.aspectRows = [];
  state.spellVars = { n: 0, x: 0 };
  state.effectInstances = [];
  state.extraTags = [];
  state.ui = { filterAspect: "all", textMode: "detailed" };
}

function newInstanceId() {
  return `fx_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function getAllocatedTokensByAspect() {
  /** @type {Record<string, number>} */
  const map = {};
  for (const row of state.aspectRows) {
    if (!row.aspect) continue;
    map[row.aspect] = (map[row.aspect] ?? 0) + (row.tokens ?? 0);
  }
  return map;
}

function getAllocatedTokensTotal() {
  return Object.values(getAllocatedTokensByAspect()).reduce((a, b) => a + b, 0);
}

function allEffectsForCurrentAspects() {
  const selectedAspects = new Set(Object.keys(getAllocatedTokensByAspect()));

  /** @type {Record<string, any>} */
  const byId = {};

  // Collect everything once (effects can be stored under any key); dedupe by id.
  for (const list of Object.values(EFFECT_LIBRARY)) {
    for (const e of list ?? []) {
      if (!e?.id) continue;
      byId[e.id] = e;
    }
  }

  /** @type {any[]} */
  const effects = [];
  for (const e of Object.values(byId)) {
    if (e.universal) {
      effects.push(e);
      continue;
    }
    const aspects = getEffectAspects(e);
    if (aspects.some((a) => selectedAspects.has(a))) effects.push(e);
  }

  // stable sort: universal first, then by priority then name
  effects.sort((x, y) => {
    const ux = x.universal ? 0 : 1;
    const uy = y.universal ? 0 : 1;
    if (ux !== uy) return ux - uy;
    if (x.priority !== y.priority) return x.priority - y.priority;
    return x.name.localeCompare(y.name);
  });

  return effects;
}

function getEffectDefById(effectId) {
  const effects = allEffectsForCurrentAspects();
  for (const e of effects) if (e.id === effectId) return e;
  return null;
}

function getEffectAspects(def) {
  if (!def) return [];
  if (Array.isArray(def.aspects) && def.aspects.length) return def.aspects.slice();
  if (def.aspect) return [def.aspect];
  return [];
}

function computeCosts() {
  const allocatedByAspect = getAllocatedTokensByAspect();
  const selected = state.effectInstances;

  let tokenCost = 0;
  let bpCost = 0;
  let nCost = 0;
  let xCost = 0;
  let subjectSpent = 0;
  let powerSpent = 0;
  let temperSpent = 0;
  let flourishSpent = 0;
  let subjectBudgetAdd = 0;
  let powerBudgetAdd = 0;
  let temperBudgetAdd = 0;
  let flourishBudgetAdd = 0;

  /** @type {string[]} */
  const tags = [];

  /** @type {Record<string, number>} */
  const spentTokensByAspect = {};

  const effects = allEffectsForCurrentAspects();
  const byId = new Map(effects.map((e) => [e.id, e]));

  for (const inst of selected) {
    const def = byId.get(inst.defId);
    if (!def) continue;

    tokenCost += def.tokenCost ?? 0;
    bpCost += def.bpCost ?? 0;
    const wc = getWordCosts(def);
    subjectSpent += wc.subject;
    powerSpent += wc.power;
    temperSpent += wc.temper;
    flourishSpent += wc.flourish;

    const wa = getWordAdds(def);
    subjectBudgetAdd += wa.subject;
    powerBudgetAdd += wa.power;
    temperBudgetAdd += wa.temper;
    flourishBudgetAdd += wa.flourish;
    tags.push(...(def.tags ?? []));

    const tokenCostForEffect = def.tokenCost ?? 0;
    if (tokenCostForEffect > 0 && !def.universal) {
      const possibleAspects = getEffectAspects(def);
      const spendAspect =
        inst.a && possibleAspects.includes(inst.a)
          ? inst.a
          : possibleAspects.length === 1
            ? possibleAspects[0]
            : possibleAspects.find((a) => (allocatedByAspect?.[a] ?? 0) > 0) || possibleAspects[0] || null;
      if (spendAspect) spentTokensByAspect[spendAspect] = (spentTokensByAspect[spendAspect] ?? 0) + tokenCostForEffect;
    }

    const n = clampInt(state.spellVars?.n ?? 0, 0, 999);
    const x = clampInt(state.spellVars?.x ?? 0, 0, 999);
    if (def.nCostPerUnit != null) nCost += (def.nCostPerUnit ?? 0) * n;
    if (def.xCostPerUnit != null) xCost += (def.xCostPerUnit ?? 0) * x;
  }

  const totalBp = bpCost;
  const totalCostString = formatSpellCost(totalBp, nCost, xCost);

  // tokens remaining is based on allocation vs tokenCost
  const tokensAllocated = Object.values(allocatedByAspect).reduce((a, b) => a + b, 0);
  const tokensSpentTotal = Object.values(spentTokensByAspect).reduce((a, b) => a + b, 0);
  const tokensRemainingRaw = tokensAllocated - tokensSpentTotal;
  const tokensRemaining = Math.max(0, tokensRemainingRaw);

  /** @type {Record<string, {allocated: number, spent: number, remainingRaw: number}>} */
  const tokensByAspect = {};
  for (const [aspect, allocated] of Object.entries(allocatedByAspect)) {
    const spent = spentTokensByAspect[aspect] ?? 0;
    tokensByAspect[aspect] = { allocated, spent, remainingRaw: allocated - spent };
  }

  // words are a pure currency used by effects (no typed word slots)
  const usedWords = 0;
  const subjectBudget = WORD_BUDGET.subject + subjectBudgetAdd;
  const powerBudget = WORD_BUDGET.power + powerBudgetAdd;
  const temperBudget = WORD_BUDGET.temper + temperBudgetAdd;
  const flourishBudget = WORD_BUDGET.flourish + flourishBudgetAdd;

  const subjectRemainingRaw = subjectBudget - subjectSpent;
  const powerRemainingRaw = powerBudget - powerSpent;
  const temperRemainingRaw = temperBudget - temperSpent;
  const flourishRemainingRaw = flourishBudget - flourishSpent;

  const subjectRemaining = Math.max(0, subjectRemainingRaw);
  const powerRemaining = Math.max(0, powerRemainingRaw);
  const temperRemaining = Math.max(0, temperRemainingRaw);
  const flourishRemaining = Math.max(0, flourishRemainingRaw);

  const wordsRemainingRaw = subjectRemainingRaw + powerRemainingRaw + temperRemainingRaw + flourishRemainingRaw;
  const wordsRemaining = Math.max(0, wordsRemainingRaw);

  return {
    tokenCost,
    tokensAllocated,
    tokensRemaining,
    tokensRemainingRaw,
    tokensByAspect,
    bpCost: totalBp,
    nCost,
    xCost,
    usedWords,
    effectWordCost: subjectSpent + powerSpent + temperSpent + flourishSpent,
    wordCost: subjectSpent + powerSpent + temperSpent + flourishSpent,
    wordsRemaining,
    wordsRemainingRaw,
    wordsByType: {
      subject: { budget: subjectBudget, spent: subjectSpent, remainingRaw: subjectRemainingRaw, remaining: subjectRemaining },
      power: { budget: powerBudget, spent: powerSpent, remainingRaw: powerRemainingRaw, remaining: powerRemaining },
      temper: { budget: temperBudget, spent: temperSpent, remainingRaw: temperRemainingRaw, remaining: temperRemaining },
      flourish: { budget: flourishBudget, spent: flourishSpent, remainingRaw: flourishRemainingRaw, remaining: flourishRemaining },
    },
    tags: uniq(tags.filter(Boolean)).sort((a, b) => a.localeCompare(b)),
    totalCostString,
  };
}

function buildSpellText() {
  const effects = allEffectsForCurrentAspects();
  const byId = new Map(effects.map((e) => [e.id, e]));

  /** @type {{priority: number, text: string, defId: string}[]} */
  const lines = [];

  function formatBullet(def, body, useShort) {
    const tags = Array.isArray(def?.tags) ? def.tags.filter(Boolean) : [];
    const prefix = !useShort && tags.length ? `[${tags.join(", ")}] ` : "";
    const s = String(body || "").trim();
    if (!s) return "";
    // Keep multi-line descriptions under one bullet by indenting subsequent lines.
    const parts = s.split(/\r?\n/);
    if (parts.length === 1) return `- ${prefix}${parts[0]}`;
    const indented = parts
      .map((p, idx) => (idx === 0 ? `- ${prefix}${p}` : `  ${p}`))
      .join("\n");
    return indented;
  }

  for (const inst of state.effectInstances) {
    const def = byId.get(inst.defId);
    if (!def) continue;
    const useShort = state.ui?.textMode === "short";
    const base = useShort ? def.shortDesc || def.desc || def.name || "" : def.desc || def.name || "";
    const n = clampInt(state.spellVars?.n ?? 0, 0, 999);
    const x = clampInt(state.spellVars?.x ?? 0, 0, 999);
    // Replace standalone N/X tokens in the text with chosen values.
    const text = String(base)
      .replace(/\bN\b/g, String(n))
      .replace(/\bX\b/g, String(x));
    const bullet = formatBullet(def, text, useShort);
    if (bullet) lines.push({ priority: def.priority, text: bullet, defId: inst.defId });
  }

  // Order by sentence priority (Subject -> Power -> Temper -> Flourish -> Wordless),
  // then preserve raw-list order within each bucket.
  lines.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const da = byId.get(a.defId);
    const db = byId.get(b.defId);
    const oa = Number(da?.order ?? 0);
    const ob = Number(db?.order ?? 0);
    if (oa !== ob) return oa - ob;
    return a.text.localeCompare(b.text);
  });

  const effectsText = lines.length ? lines.map((l) => l.text).join("\n") : "(Add effects to generate text.)";
  return effectsText;
}

function selectedEffectsInPriorityOrder() {
  const effects = allEffectsForCurrentAspects();
  const byId = new Map(effects.map((e) => [e.id, e]));
  /** @type {{instanceId: string, defId: string, priority: number}[]} */
  const list = [];
  for (const inst of state.effectInstances) {
    const def = byId.get(inst.defId);
    if (!def) continue;
    list.push({ instanceId: inst.instanceId, defId: inst.defId, priority: def.priority });
  }
  list.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const da = byId.get(a.defId);
    const db = byId.get(b.defId);
    const oa = Number(da?.order ?? 0);
    const ob = Number(db?.order ?? 0);
    if (oa !== ob) return oa - ob;
    return a.instanceId.localeCompare(b.instanceId);
  });
  return list;
}

function renderAspectRows() {
  const container = el("aspectRows");
  container.innerHTML = "";

  el("aspectsHint").style.display = state.aspectRows.length ? "none" : "block";

  const usedAspects = state.aspectRows.map((r) => r.aspect).filter(Boolean);

  for (const row of state.aspectRows) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    rowDiv.dataset.rowId = row.rowId;

    const fieldAspect = document.createElement("div");
    fieldAspect.className = "field";
    const labelAspect = document.createElement("label");
    labelAspect.textContent = "Aspect";
    const select = document.createElement("select");
    select.dataset.action = "aspect-change";
    select.dataset.rowId = row.rowId;

    const optPlaceholder = document.createElement("option");
    optPlaceholder.value = "";
    optPlaceholder.textContent = "Select an aspect…";
    select.appendChild(optPlaceholder);

    for (const a of ASPECTS) {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      // prevent duplicates (except keep current selected)
      if (usedAspects.includes(a) && row.aspect !== a) opt.disabled = true;
      if (row.aspect === a) opt.selected = true;
      select.appendChild(opt);
    }

    fieldAspect.appendChild(labelAspect);
    fieldAspect.appendChild(select);

    const fieldTokens = document.createElement("div");
    fieldTokens.className = "field";
    const labelTokens = document.createElement("label");
    labelTokens.textContent = "Number of Tokens";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "99";
    input.step = "1";
    input.value = String(row.tokens ?? 0);
    input.dataset.action = "tokens-change";
    input.dataset.rowId = row.rowId;
    input.placeholder = "0";
    fieldTokens.appendChild(labelTokens);
    fieldTokens.appendChild(input);

    const del = document.createElement("button");
    del.className = "iconBtn";
    del.type = "button";
    del.textContent = "✕";
    del.title = "Remove aspect";
    del.dataset.action = "aspect-remove";
    del.dataset.rowId = row.rowId;

    rowDiv.appendChild(fieldAspect);
    rowDiv.appendChild(fieldTokens);
    rowDiv.appendChild(del);
    container.appendChild(rowDiv);
  }
}

function renderTokensWindow() {
  const list = el("tokensList");
  list.innerHTML = "";

  const allocated = getAllocatedTokensByAspect();
  const costs = computeCosts();

  el("tokensRemaining").textContent = String(costs.tokensRemaining);
  el("wordsRemaining").textContent = String(costs.wordsRemaining);
  el("wordsRemSubject").textContent = String(costs.wordsByType?.subject?.remaining ?? 0);
  el("wordsRemPower").textContent = String(costs.wordsByType?.power?.remaining ?? 0);
  el("wordsRemTemper").textContent = String(costs.wordsByType?.temper?.remaining ?? 0);
  el("wordsRemFlourish").textContent = String(costs.wordsByType?.flourish?.remaining ?? 0);

  const aspects = Object.keys(allocated).sort((a, b) => a.localeCompare(b));
  if (!aspects.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "Allocated tokens will show here.";
    list.appendChild(empty);
    return;
  }

  for (const a of aspects) {
    const detail = costs.tokensByAspect?.[a] ?? { allocated: allocated[a] ?? 0, spent: 0, remainingRaw: (allocated[a] ?? 0) };
    const line = document.createElement("div");
    line.className = "tokenLine";
    const left = document.createElement("div");
    left.className = "left";
    const aspect = document.createElement("div");
    aspect.className = "aspect";
    aspect.textContent = a;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Allocated ${detail.allocated} • Spent ${detail.spent} • Remaining ${Math.max(0, detail.remainingRaw)}`;
    left.appendChild(aspect);
    left.appendChild(meta);
    const count = document.createElement("div");
    count.className = "count";
    count.textContent = String(detail.remainingRaw);
    line.appendChild(left);
    line.appendChild(count);
    list.appendChild(line);
  }
}

function renderEffects() {
  const container = el("effectsContainer");
  container.innerHTML = "";

  if (!state.effectInstances.length) {
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "No effects yet. Click Add Effect to add one.";
    container.appendChild(hint);
    return;
  }

  const effects = allEffectsForCurrentAspects();
  const byId = new Map(effects.map((e) => [e.id, e]));

  const rows = state.effectInstances
    .map((inst) => ({ inst, def: byId.get(inst.defId) }))
    .filter((x) => !!x.def)
    .map((x) => /** @type {{inst:any, def:any}} */ (x));

  rows.sort((a, b) => {
    const wa = wordTypeRank(a.def);
    const wb = wordTypeRank(b.def);
    if (wa !== wb) return wa - wb;
    const oa = Number(a.def.order ?? 0);
    const ob = Number(b.def.order ?? 0);
    if (oa !== ob) return oa - ob;
    return a.def.name.localeCompare(b.def.name);
  });

  for (const { inst, def } of rows) {
    const instanceId = inst.instanceId;

    const card = document.createElement("div");
    card.className = "effectCard";
    card.dataset.instanceId = instanceId;

    const possibleAspects = getEffectAspects(def);

    const top = document.createElement("div");
    top.className = "effectTop";

    const name = document.createElement("div");
    name.className = "effectName";
    // Names are already fully formatted in the raw list (keep exact)
    name.textContent = def.name;

    const badges = document.createElement("div");
    badges.className = "effectBadges";
    if (def.universal) {
      const b = document.createElement("span");
      b.className = "badge universal";
      b.textContent = "Universal";
      badges.appendChild(b);
    }
    if (possibleAspects.length === 1 && possibleAspects[0]) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = possibleAspects[0];
      badges.appendChild(b);
    }
    if ((def.bpCost ?? 0) > 0) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = `${def.bpCost} BP`;
      badges.appendChild(b);
    }
    const bP = document.createElement("span");
    bP.className = "badge";
    bP.textContent = `P${def.priority}`;
    badges.appendChild(bP);

    const remove = document.createElement("button");
    remove.className = "iconBtn";
    remove.type = "button";
    remove.textContent = "✕";
    remove.title = "Remove effect";
    remove.dataset.action = "effect-remove";
    remove.dataset.instanceId = instanceId;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";
    right.style.alignItems = "center";
    right.appendChild(badges);
    right.appendChild(remove);

    top.appendChild(name);
    top.appendChild(right);

    const desc = document.createElement("p");
    desc.className = "effectDesc";
    desc.textContent = def.desc || "";

    // Small cost visualization line (tokens/words/BP + per-N/per-X scaling)
    const costLine = document.createElement("p");
    costLine.className = "effectCostLine";
    const wc = getWordCosts(def);
    const wordBits = [];
    if (wc.subject) wordBits.push(`S${wc.subject}`);
    if (wc.power) wordBits.push(`P${wc.power}`);
    if (wc.temper) wordBits.push(`T${wc.temper}`);
    if (wc.flourish) wordBits.push(`F${wc.flourish}`);

    const baseBits = [];
    if ((def.bpCost ?? 0) !== 0) baseBits.push(`${signed(def.bpCost)} BP`);
    if (!def.universal && (def.tokenCost ?? 0) > 0) {
      const spend = inst.a && possibleAspects.includes(inst.a) ? inst.a : possibleAspects[0];
      baseBits.push(`${def.tokenCost} token${spend ? ` (${spend})` : ""}`);
    }
    if (wordBits.length) baseBits.push(`Words: ${wordBits.join(" ")}`);
    if (!baseBits.length) baseBits.push("Free");

    const scaleBits = [];
    if (def.nCostPerUnit != null && (def.nCostPerUnit ?? 0) !== 0) scaleBits.push(`+${def.nCostPerUnit}N per N`);
    else if (def.nVar) scaleBits.push("N variable");
    if (def.xCostPerUnit != null && (def.xCostPerUnit ?? 0) !== 0) scaleBits.push(`+${def.xCostPerUnit}X per X`);
    else if (def.xVar) scaleBits.push("X variable");
    const wa = getWordAdds(def);
    const addBits = [];
    if (wa.subject) addBits.push(`+S${wa.subject}`);
    if (wa.power) addBits.push(`+P${wa.power}`);
    if (wa.temper) addBits.push(`+T${wa.temper}`);
    if (wa.flourish) addBits.push(`+F${wa.flourish}`);
    costLine.textContent = `Costs: ${baseBits.join(" • ")}${scaleBits.length ? ` • ${scaleBits.join(" • ")}` : ""}${addBits.length ? ` • Adds: ${addBits.join(" ")}` : ""}`;

    const controls = document.createElement("div");
    controls.className = "effectControls";

    // N/X are spell-wide now; per-effect inputs are intentionally not rendered.

    // Token-aspect selection if effect belongs to multiple aspects
    if (!def.universal && (def.tokenCost ?? 0) > 0 && possibleAspects.length > 1) {
      const aWrap = document.createElement("div");
      aWrap.className = "field";
      aWrap.style.gridColumn = "1 / -1";
      const aLabel = document.createElement("label");
      aLabel.textContent = "Spend token from (aspect)";
      const aSelect = document.createElement("select");
      aSelect.dataset.action = "effect-aspect";
      aSelect.dataset.instanceId = instanceId;

      const allocated = getAllocatedTokensByAspect();
      const allocatedAspects = new Set(Object.keys(allocated));

      // Default selection
      if (!inst.a || !possibleAspects.includes(inst.a)) {
        inst.a = possibleAspects.find((a) => allocatedAspects.has(a)) || possibleAspects[0];
      }

      for (const a of possibleAspects) {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        if (a === inst.a) opt.selected = true;
        // If user hasn't allocated this aspect at all, disable choosing it
        if (!allocatedAspects.has(a)) opt.disabled = true;
        aSelect.appendChild(opt);
      }

      aWrap.appendChild(aLabel);
      aWrap.appendChild(aSelect);
      controls.appendChild(aWrap);
    } else if (!def.universal && (def.tokenCost ?? 0) > 0 && possibleAspects.length === 1 && !inst.a) {
      // For single-aspect effects, store the spend-aspect implicitly for export/import stability
      inst.a = possibleAspects[0];
    }

    // Special-case: Elemental variant
    if (inst.defId === "a-elemental-burst") {
      const vWrap = document.createElement("div");
      vWrap.className = "field";
      vWrap.style.gridColumn = "1 / -1";
      const vLabel = document.createElement("label");
      vLabel.textContent = "Element (variant)";
      const vSelect = document.createElement("select");
      vSelect.dataset.action = "effect-variant";
      vSelect.dataset.instanceId = instanceId;
      const variants = ["fire", "ice", "lightning", "wind", "stone", "water"];
      const current = inst.variant || "fire";
      for (const v of variants) {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v[0].toUpperCase() + v.slice(1);
        if (v === current) opt.selected = true;
        vSelect.appendChild(opt);
      }
      vWrap.appendChild(vLabel);
      vWrap.appendChild(vSelect);
      controls.appendChild(vWrap);
    }

    card.appendChild(top);
    if (def.desc) card.appendChild(desc);
    card.appendChild(costLine);
    card.appendChild(controls);
    container.appendChild(card);
  }
}

function renderAddEffectPanel() {
  const panel = el("addEffectPanel");
  const filter = el("filterAspect");
  const select = el("selectEffectToAdd");
  filter.innerHTML = "";
  select.innerHTML = "";

  const costs = computeCosts();
  const allocated = getAllocatedTokensByAspect();
  const availableAspects = Object.keys(allocated).sort((a, b) => a.localeCompare(b));

  // Build filter options
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "All";
  filter.appendChild(optAll);
  for (const a of availableAspects) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    filter.appendChild(opt);
  }
  const optUni = document.createElement("option");
  optUni.value = "universal";
  optUni.textContent = "Universal";
  filter.appendChild(optUni);

  // Keep selection stable
  if (state.ui?.filterAspect && [...filter.options].some((o) => o.value === state.ui.filterAspect)) {
    filter.value = state.ui.filterAspect;
  } else {
    state.ui.filterAspect = "all";
    filter.value = "all";
  }

  const all = allEffectsForCurrentAspects();
  const selectedIds = new Set(state.effectInstances.map((x) => x.defId));

  function isAffordableByWords(e) {
    const wc = getWordCosts(e);
    return !(
      (costs.wordsByType?.subject?.remainingRaw ?? 0) < wc.subject ||
      (costs.wordsByType?.power?.remainingRaw ?? 0) < wc.power ||
      (costs.wordsByType?.temper?.remainingRaw ?? 0) < wc.temper ||
      (costs.wordsByType?.flourish?.remainingRaw ?? 0) < wc.flourish
    );
  }

  function isAffordableByTokens(e) {
    if (e.universal || (e.tokenCost ?? 0) <= 0) return true;
    const needed = e.tokenCost ?? 0;
    const aspects = getEffectAspects(e);
    // Adequate to have ONE of the listed aspect tokens available.
    // If the user filtered to a specific aspect, require affordability from that aspect.
    if (state.ui?.filterAspect && state.ui.filterAspect !== "all" && state.ui.filterAspect !== "universal") {
      const a = state.ui.filterAspect;
      return aspects.includes(a) && (costs.tokensByAspect?.[a]?.remainingRaw ?? 0) >= needed;
    }
    return aspects.some((a) => (costs.tokensByAspect?.[a]?.remainingRaw ?? 0) >= needed);
  }

  function passesAspectFilter(e) {
    const f = state.ui?.filterAspect ?? "all";
    if (f === "all") return true;
    if (f === "universal") return !!e.universal;
    // specific aspect: show effects that belong to that aspect (universal hidden unless f=universal)
    if (e.universal) return false;
    return getEffectAspects(e).includes(f);
  }

  const addable = all
    .filter((e) => !selectedIds.has(e.id) || !!e.stackable)
    .filter((e) => passesAspectFilter(e))
    .filter((e) => isAffordableByWords(e) && isAffordableByTokens(e));
  addable.sort((a, b) => {
    const wa = wordTypeRank(a);
    const wb = wordTypeRank(b);
    if (wa !== wb) return wa - wb;
    const oa = Number(a.order ?? 0);
    const ob = Number(b.order ?? 0);
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = addable.length ? "Select an effect…" : "No available effects";
  select.appendChild(placeholder);

  for (const e of addable) {
    const opt = document.createElement("option");
    opt.value = e.id;
    // Names are already fully formatted in the raw list (keep exact)
    opt.textContent = e.name;

    select.appendChild(opt);
  }

  // If nothing is selectable, keep panel visible but button won't add anything
  if (panel.style.display !== "none") {
    // keep current selection if still valid; otherwise reset
    const current = select.value;
    if (current && !addable.some((e) => e.id === current)) select.value = "";
  }
}

function renderSpellSummary() {
  const costs = computeCosts();
  el("sumTotalCost").textContent = costs.totalCostString;
  el("sumTags").textContent = costs.tags.length ? costs.tags.join(", ") : "—";

  el("spellText").textContent = buildSpellText();

  const warningEl = el("budgetWarning");
  const warnings = [];
  const overspentAspects = Object.entries(costs.tokensByAspect ?? {})
    .filter(([, v]) => (v?.remainingRaw ?? 0) < 0)
    .map(([a]) => a);
  if (overspentAspects.length) {
    warnings.push(`Not enough tokens in: ${overspentAspects.join(", ")}.`);
  }
  const wordProblems = [];
  if ((costs.wordsByType?.subject?.remainingRaw ?? 0) < 0) wordProblems.push("Subject");
  if ((costs.wordsByType?.power?.remainingRaw ?? 0) < 0) wordProblems.push("Power");
  if ((costs.wordsByType?.temper?.remainingRaw ?? 0) < 0) wordProblems.push("Temper");
  if ((costs.wordsByType?.flourish?.remainingRaw ?? 0) < 0) wordProblems.push("Flourish");
  if (wordProblems.length) warnings.push(`Not enough words in: ${wordProblems.join(", ")}.`);
  warningEl.style.display = warnings.length ? "block" : "none";
  warningEl.textContent = warnings.join(" ");
}

function renderAll() {
  renderAspectRows();
  renderTokensWindow();
  renderAddEffectPanel();
  renderEffects();
  renderSpellSummary();
}

function getInstance(instanceId) {
  return state.effectInstances.find((x) => x.instanceId === instanceId) || null;
}

function removeInstance(instanceId) {
  state.effectInstances = state.effectInstances.filter((x) => x.instanceId !== instanceId);
}

function setPage(page) {
  const pages = ["builder", "export", "import"];
  for (const p of pages) {
    const sec = document.querySelector(`[data-page="${p}"]#page-${p}`) || document.getElementById(`page-${p}`);
    if (sec) sec.style.display = p === page ? "block" : "none";
    const tab = document.querySelector(`.tabBtn[data-page="${p}"]`);
    if (tab) tab.setAttribute("data-active", p === page ? "true" : "false");
  }
  if (page === "export") refreshExport();
}

function currentSpellJson() {
  const allocated = getAllocatedTokensByAspect();
  const costs = computeCosts();

  // Compact list (supports duplicates)
  const fx = state.effectInstances.map((inst) => {
    const o = { i: inst.defId };
    if (inst.variant) o.v = String(inst.variant);
    if (inst.a) o.a = String(inst.a);
    return o;
  });

  const spell = {
    v: state.version,
    a: allocated, // aspects + allocated tokens
    n: clampInt(state.spellVars?.n ?? 0, 0, 999),
    x: clampInt(state.spellVars?.x ?? 0, 0, 999),
    fx,
    // Derived snapshot (optional, but helpful to see at a glance)
    d: {
      token: costs.tokenCost,
      bp: costs.bpCost,
      n: costs.nCost,
      x: costs.xCost,
      word: costs.wordCost,
      cost: costs.totalCostString,
      tags: costs.tags,
      o: selectedEffectsInPriorityOrder().map((e) => e.defId),
      text: buildSpellText(),
    },
  };

  return spell;
}

function applySpellJson(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Import must be a JSON object.");

  resetState();
  state.version = clampInt(obj.v ?? 1, 1, 999);

  // aspects
  const a = obj.a;
  if (a && typeof a === "object") {
    for (const [aspect, tokens] of Object.entries(a)) {
      if (!ASPECTS.includes(aspect)) continue;
      state.aspectRows.push({ rowId: newRowId(), aspect, tokens: clampInt(tokens, 0, 99) });
    }
  }

  // spell-wide vars
  state.spellVars = {
    n: clampInt(obj.n ?? 0, 0, 999),
    x: clampInt(obj.x ?? 0, 0, 999),
  };
  const nEl = document.getElementById("spellVarN");
  const xEl = document.getElementById("spellVarX");
  if (nEl) nEl.value = String(state.spellVars.n);
  if (xEl) xEl.value = String(state.spellVars.x);

  // effects (supports both old object form and new list form)
  const fx = obj.fx;
  if (Array.isArray(fx)) {
    let fallbackN = state.spellVars.n;
    let fallbackX = state.spellVars.x;
    for (const item of fx) {
      if (!item || typeof item !== "object") continue;
      const defId = String(item.i ?? "");
      if (!defId) continue;
      const inst = { instanceId: newInstanceId(), defId };
      // old per-effect n/x (if present) are folded into spell-wide vars by taking max
      if (item.n != null) fallbackN = Math.max(fallbackN, clampInt(item.n, 0, 999));
      if (item.x != null) fallbackX = Math.max(fallbackX, clampInt(item.x, 0, 999));
      if (item.v != null) inst.variant = String(item.v);
      if (item.a != null) inst.a = String(item.a);
      state.effectInstances.push(inst);
    }
    state.spellVars.n = fallbackN;
    state.spellVars.x = fallbackX;
    if (nEl) nEl.value = String(state.spellVars.n);
    if (xEl) xEl.value = String(state.spellVars.x);
  } else if (fx && typeof fx === "object") {
    // old format: fx: { [defId]: {e:1,n?,x?,v?,a?} }
    let fallbackN = state.spellVars.n;
    let fallbackX = state.spellVars.x;
    for (const [defId, cfg] of Object.entries(fx)) {
      const c = cfg && typeof cfg === "object" ? cfg : {};
      if (!c.e) continue;
      const inst = { instanceId: newInstanceId(), defId };
      if (c.n != null) fallbackN = Math.max(fallbackN, clampInt(c.n, 0, 999));
      if (c.x != null) fallbackX = Math.max(fallbackX, clampInt(c.x, 0, 999));
      if (c.v != null) inst.variant = String(c.v);
      if (c.a != null) inst.a = String(c.a);
      state.effectInstances.push(inst);
    }
    state.spellVars.n = fallbackN;
    state.spellVars.x = fallbackX;
    if (nEl) nEl.value = String(state.spellVars.n);
    if (xEl) xEl.value = String(state.spellVars.x);
  }
}

function refreshExport() {
  const json = compactJson(currentSpellJson());
  el("exportJson").value = json;
  el("exportHint").textContent = `Length: ${json.length} chars`;
}

async function copyExportToClipboard() {
  const text = el("exportJson").value || "";
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    el("exportHint").textContent = "Copied to clipboard.";
  } catch {
    // fallback: select text
    el("exportJson").focus();
    el("exportJson").select();
    el("exportHint").textContent = "Select-all fallback used (Ctrl+C).";
  }
}

function wireEvents() {
  // Add Effect panel
  el("btnAddEffect").addEventListener("click", () => {
    const panel = el("addEffectPanel");
    const next = panel.style.display === "none" ? "grid" : "none";
    panel.style.display = next;
    renderAddEffectPanel();
  });

  el("btnCancelAddEffect").addEventListener("click", () => {
    el("addEffectPanel").style.display = "none";
  });

  el("filterAspect").addEventListener("change", (ev) => {
    state.ui.filterAspect = String(/** @type {HTMLSelectElement} */ (ev.target).value || "all");
    renderAddEffectPanel();
  });

  el("btnConfirmAddEffect").addEventListener("click", () => {
    const effectId = el("selectEffectToAdd").value;
    if (!effectId) return;

    const def = getEffectDefById(effectId);
    if (!def) return;

    // Enforce affordability at click-time too
    const costs = computeCosts();
    const wc = getWordCosts(def);
    if (
      (costs.wordsByType?.subject?.remainingRaw ?? 0) < wc.subject ||
      (costs.wordsByType?.power?.remainingRaw ?? 0) < wc.power ||
      (costs.wordsByType?.temper?.remainingRaw ?? 0) < wc.temper ||
      (costs.wordsByType?.flourish?.remainingRaw ?? 0) < wc.flourish
    ) {
      return;
    }
    if (!def.universal && (def.tokenCost ?? 0) > 0) {
      const needed = def.tokenCost ?? 0;
      const aspects = getEffectAspects(def);
      const anyAffordable = aspects.some((a) => (costs.tokensByAspect?.[a]?.remainingRaw ?? 0) >= needed);
      if (!anyAffordable) return;
    }

    // If not stackable, don't add duplicates
    if (!def.stackable && state.effectInstances.some((x) => x.defId === effectId)) return;

    const inst = { instanceId: newInstanceId(), defId: effectId };
    if (effectId === "a-elemental-burst") inst.variant = "fire";
    if (!def.universal && (def.tokenCost ?? 0) > 0) {
      const needed = def.tokenCost ?? 0;
      const aspects = getEffectAspects(def);
      // If filter is set to an aspect and it's valid/affordable, prefer it.
      const f = state.ui?.filterAspect;
      if (f && f !== "all" && f !== "universal" && aspects.includes(f) && (costs.tokensByAspect?.[f]?.remainingRaw ?? 0) >= needed) {
        inst.a = f;
      } else {
        inst.a = aspects.find((a) => (costs.tokensByAspect?.[a]?.remainingRaw ?? 0) >= needed) || aspects[0];
      }
    }
    state.effectInstances.push(inst);

    // Keep panel open for rapid adding
    renderAll();
    // reset selection
    el("selectEffectToAdd").value = "";
  });

  // Tabs
  document.querySelectorAll(".tabBtn[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => setPage(btn.dataset.page));
  });

  // Add Aspect
  el("btnAddAspect").addEventListener("click", () => {
    state.aspectRows.push({ rowId: newRowId(), aspect: null, tokens: 0 });
    renderAll();
  });

  // Reset
  el("btnReset").addEventListener("click", () => {
    resetState();
    const nEl = document.getElementById("spellVarN");
    const xEl = document.getElementById("spellVarX");
    if (nEl) nEl.value = "0";
    if (xEl) xEl.value = "0";
    renderAll();
  });

  // Aspect rows event delegation
  el("aspectRows").addEventListener("change", (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!t?.dataset?.action) return;
    const rowId = t.dataset.rowId;
    if (!rowId) return;
    const row = state.aspectRows.find((r) => r.rowId === rowId);
    if (!row) return;

    if (t.dataset.action === "aspect-change") {
      const v = /** @type {HTMLSelectElement} */ (t).value;
      row.aspect = v || null;
      // Prune selected effects that no longer exist (e.g., removed aspect)
      pruneSelectedEffectsToVisible();
      renderAll();
    }
  });

  el("aspectRows").addEventListener("input", (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!t?.dataset?.action) return;
    const rowId = t.dataset.rowId;
    if (!rowId) return;
    const row = state.aspectRows.find((r) => r.rowId === rowId);
    if (!row) return;
    if (t.dataset.action === "tokens-change") {
      row.tokens = clampInt(/** @type {HTMLInputElement} */ (t).value, 0, 99);
      renderTokensWindow();
      renderSpellSummary();
    }
  });

  el("aspectRows").addEventListener("click", (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!t?.dataset?.action) return;
    if (t.dataset.action === "aspect-remove") {
      const rowId = t.dataset.rowId;
      state.aspectRows = state.aspectRows.filter((r) => r.rowId !== rowId);
      pruneSelectedEffectsToVisible();
      renderAll();
    }
  });

  function handleEffectAction(target) {
    const t = /** @type {HTMLElement} */ (target);
    if (!t?.dataset?.action) return;
    const instanceId = t.dataset.instanceId;
    if (!instanceId) return;
    const inst = getInstance(instanceId);
    if (!inst) return;

    if (t.dataset.action === "effect-remove") {
      removeInstance(instanceId);
      renderAll();
      return;
    }

    if (t.dataset.action === "effect-variant") {
      inst.variant = /** @type {HTMLSelectElement} */ (t).value;
      renderSpellSummary();
    }

    if (t.dataset.action === "effect-aspect") {
      inst.a = /** @type {HTMLSelectElement} */ (t).value;
      renderAll();
    }
  }

  // Effects event delegation (input = live for numbers, change = selects, checkbox)
  el("effectsContainer").addEventListener("input", (ev) => handleEffectAction(ev.target));
  el("effectsContainer").addEventListener("change", (ev) => handleEffectAction(ev.target));
  el("effectsContainer").addEventListener("click", (ev) => handleEffectAction(ev.target));

  // Spell-wide N/X
  el("spellVarN").addEventListener("input", (ev) => {
    state.spellVars.n = clampInt(/** @type {HTMLInputElement} */ (ev.target).value, 0, 999);
    renderTokensWindow();
    renderSpellSummary();
  });
  el("spellVarX").addEventListener("input", (ev) => {
    state.spellVars.x = clampInt(/** @type {HTMLInputElement} */ (ev.target).value, 0, 999);
    renderTokensWindow();
    renderSpellSummary();
  });

  // Spell text mode toggle
  el("btnTextDetailed").addEventListener("click", () => {
    state.ui.textMode = "detailed";
    el("btnTextDetailed").setAttribute("data-active", "true");
    el("btnTextShort").setAttribute("data-active", "false");
    renderSpellSummary();
  });
  el("btnTextShort").addEventListener("click", () => {
    state.ui.textMode = "short";
    el("btnTextDetailed").setAttribute("data-active", "false");
    el("btnTextShort").setAttribute("data-active", "true");
    renderSpellSummary();
  });

  // Export/Import
  el("btnRefreshExport").addEventListener("click", refreshExport);
  el("btnCopyExport").addEventListener("click", copyExportToClipboard);

  el("btnApplyImport").addEventListener("click", () => {
    const txt = el("importJson").value || "";
    const parsed = safeJsonParse(txt.trim());
    if (!parsed.ok) {
      el("importHint").textContent = `Invalid JSON: ${parsed.error}`;
      return;
    }
    try {
      applySpellJson(parsed.value);
      el("importHint").textContent = "Import applied.";
      setPage("builder");
      renderAll();
    } catch (e) {
      el("importHint").textContent = `Import failed: ${String(e?.message || e)}`;
    }
  });
}

function pruneSelectedEffectsToVisible() {
  const visible = new Set(allEffectsForCurrentAspects().map((e) => e.id));
  state.effectInstances = state.effectInstances.filter((x) => visible.has(x.defId));
}

function init() {
  wireEvents();
  renderAll();
  refreshExport();
}

window.addEventListener("DOMContentLoaded", init);

