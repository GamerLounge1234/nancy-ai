import { Groq } from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline, env } from "@xenova/transformers";

env.remoteHost = 'https://hf-mirror.com';
env.allowLocalModels = false;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// ==========================================
// 🧠 LOCAL PERK DATABASE (O(1) Retrieval)
// ==========================================
const LOCAL_PERK_DATABASE = {
  "a place for us": {
    name: "A Place For Us",
    role: "Survivor",
    character: "Kwon Tae-young",
    description: "While healing another Survivor, both you and the healed Survivor gain Elusive Status Effect. When you finish healing the Obsession, both you and the Obsession gain Elusive Status Effect for 20/25/30 seconds. Reduces your chance of becoming the initial Obsession by reducing the default value by -100 %."
  },
  "ace in the hole": {
    name: "Ace in the Hole",
    role: "Survivor",
    character: "Ace Visconti",
    description: "Causes all regular Items you retrieve from a Chest to come equipped with 1 to 2 Add-ons: First Slot: 100 % chance to be equipped with an Add-on of Visceral Rarity or lower. Second Slot: 50/75/100 % chance to be equipped with an Add-on of Uncommon Rarity or lower. Prevents any attached Add-ons on your currently held Item to be consumed upon escaping the Trial."
  },
  "adrenaline": {
    name: "Adrenaline",
    role: "Survivor",
    character: "Meg Thomas",
    description: "Once the Exit Gates are powered, Adrenaline activates: Heals you to the next Health State. Grants a +50 % Haste Status Effect for 3 seconds. Causes the Exhausted Status Effect for 60/50/40 seconds after use."
  },
  "aftercare": {
    name: "Aftercare",
    role: "Survivor",
    character: "Jeff Johansen",
    description: "Unlocks potential in your Aura-reading ability: You see the Auras of the 1/2/3 most recent Survivor(s) that helped you or vice versa: Rescued from a Hook. Completed a Healing action on. They also see your Aura. Aftercare resets its effects when you are hooked by the Killer."
  },
  "alert": {
    name: "Alert",
    role: "Survivor",
    character: "Feng Min",
    description: "Whenever the Killer performs the Break or Damage Action, Alert triggers: Their Aura is revealed to you for 3/4/5 seconds."
  },
  "any means necessary": {
    name: "Any Means Necessary",
    role: "Survivor",
    character: "Yui Kimura",
    description: "Unlocks potential in your Aura-reading ability: The Auras of dropped Pallets in the environment are revealed to you. While standing next to a dropped Pallet, press and hold the Active Ability button to trigger the following effect: Resets the Pallet to its upright position over 5/4/3 seconds."
  },
  "apocalyptic ingenuity": {
    name: "Apocalyptic Ingenuity",
    role: "Survivor",
    character: "Rick Grimes",
    description: "Unlocks potential in your Aura-reading ability: The Auras of broken Pallets are revealed to you within 24/28/32 metres. After unlocking or rummaging through 2 Chests, Apocalyptic Ingenuity gains a special ability. While standing next to the location of a broken Pallet, press and hold the Active Ability button for 4 seconds to use it: Rebuilds it as a Fragile Pallet. Fragile Pallets instantly break when dropped."
  },
  "appraisal": {
    name: "Appraisal",
    role: "Survivor",
    character: "Élodie Rakoto",
    description: "Start the Trial with 4 Tokens. While standing next to an unlocked and empty Chest, press and hold the Interaction button to perform the Rummage action: Grants the ability to retrieve an extra Item from that Chest. This consumes -1 Token and is limited to twice per Chest. Increases the Rummaging speed by 40/60/80 %."
  },
  "autodidact": {
    name: "Autodidact",
    role: "Survivor",
    character: "Adam Francis",
    description: "Succeeding a Skill Check while healing another Survivor grants +1 Token, up to a maximum of 3/4/5 Tokens: Suppresses Great Healing Skill Checks. Causes Good Healing Skill Checks to grant Healing progress based on the number of accumulated Tokens: 0 Tokens: -15 %. 1 Token: +0 %. 2 Tokens: +15 %. 3 Tokens: +30 % (limit of Tier I). 4 Tokens: +45 % (limit of Tier II). 5 Tokens: +60 % (limit of Tier III). Autodidact is inactive when healing using a Med-Kit."
  },
  "babysitter": {
    name: "Babysitter",
    role: "Survivor",
    character: "Steve Harrington",
    description: "Whenever you unhook another Survivor, you benefit from the following effect: The Aura of the Killer is revealed to you for 8 seconds. The unhooked Survivor benefits from the following effects instead for 20/25/30 seconds: Suppresses the creation of their Scratch Marks and Pools of Blood. Increases the strength of their Haste Status Effect by +10 %."
  },
  "background player": {
    name: "Background Player",
    role: "Survivor",
    character: "Renato Lyra",
    description: "Whenever the Killer picks up any other Survivor in the Dying State, Background Player activates for 10 seconds. While active, starting to run triggers the following effect: Grants a +50 % Haste Status Effect for 5 seconds. Background Player cannot be used while Exhausted. Background Player causes the Exhausted Status Effect for 30/25/20 seconds after use."
  },
  "bada bada boom": {
    name: "Bada Bada Boom",
    role: "Survivor",
    character: "Dustin Henderson",
    description: "After completing 20 % worth of Generator repairs, Bada Bada Boom activates: While active, press Active Ability button next to a window to install a Trap, which stays active for up to 40/50/60 seconds. The Trap triggers when the Killer performs a vault through the window, causing the Killer to suffer from a -50 % Hindered Status Effect for 6 seconds. Bada Bada Boom deactivates after triggering successfully or once the timer runs out. The Auras of Trapped Windows are revealed to all Survivors in yellow."
  },
  "balanced landing": {
    name: "Balanced Landing",
    role: "Survivor",
    character: "Nea Karlsson",
    description: "While falling from height, you benefit from the following effects: Suppresses all noises related to falling and landing. Reduces the duration of the Stagger upon landing by -75 %. Grants a +50 % Haste Status Effect for 3 seconds. Balanced Landing cannot be used while Exhausted. Balanced Landing causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "bardic inspiration": {
    name: "Bardic Inspiration",
    role: "Survivor",
    character: "Aestri",
    description: "Press the Active Ability button while standing and motionless to enter the Performance interaction that lasts up to 15 seconds and empowers other Survivors within 16 metres of your location. The empowering effect depends on the result of you rolling a d20 and lasts for 90 seconds after completing the Performance: 1: You scream, but without notifying the Killer. 2 - 10: Skill Checks grant +1 % Progression. 11 - 19: Skill Checks grant +2 % Progression. 20: Skill Checks grant +3 % Progression. Bardic Inspiration has a cool-down of 110/100/90 seconds after completing the Performance or cancelling it."
  },
  "better together": {
    name: "Better Together",
    role: "Survivor",
    character: "Nancy Wheeler",
    description: "While repairing any Generator, you and the other Survivors benefit from the following primary effect: The Aura of that Generator is revealed to all Survivors and highlighted in yellow. Whenever the Killer downs another Survivor while you are repairing, you benefit from the following secondary effect: The Auras of all Survivors are revealed to you for 20/25/30 seconds."
  },
  "better than new": {
    name: "Better than New",
    role: "Survivor",
    character: "Rebecca Chambers",
    description: "Completing a Healing action on another Survivor grants them the following benefits until they receive damage again: Increases their Action speeds for Blessing, Cleansing, Healing, and Unlocking by 12/14/16 %."
  },
  "bite the bullet": {
    name: "Bite the Bullet",
    role: "Survivor",
    character: "Leon Scott Kennedy",
    description: "When healing yourself or another Survivor, you benefit from the following effects: Suppresses all noises related to Healing and Grunts of Pain. Failed Healing Skill Checks do not trigger a Loud Noise Notification. Reduces the Penalty to 3/2/1 % of the total Progression."
  },
  "blast mine": {
    name: "Blast Mine",
    role: "Survivor",
    character: "Jill Valentine",
    description: "After repairing Generators for the equivalent of 40 % of Progression, Blast Mine activates. While active, press the Active Ability button while standing next to a Generator to install a trap to it with a countdown of 100/110/120 seconds: Trips half-way through the Killer attempting to damage the Trapped Generator: Stuns the Killer for 4 seconds. Blinds all Players within 12.5 metres of the Trapped Generator. The trap is deactivated after its countdown has elapsed or it is tripped. The Auras of Trapped Generators are revealed to all Survivors in yellow."
  },
  "blood pact": {
    name: "Blood Pact",
    role: "Survivor",
    character: "Cheryl Mason",
    description: "When either you or the Obsession become injured by any means, Blood Pact activates: Your Auras are constantly revealed to one another. Completing a Healing Action on the Obsession or having them complete one on yourself, grants both of you a 5/6/7 % Haste Status Effect. This effect lasts for as long as you both remain within 16 metres of one another. Blood Pact is temporarily disabled if you yourself are the Obsession. Reduces your chance of becoming the initial Obsession by reducing the default value by -100 %."
  },
  "blood rush": {
    name: "Blood Rush",
    role: "Survivor",
    character: "Renato Lyra",
    description: "After being unhooked by any means, Blood Rush activates for 40/50/60 seconds. While active, press the Active Ability button to trigger the following effect: Instantly recover from an existing Exhausted Status Effect. Blood Rush does not cause the Exhausted Status Effect. Blood Rush is deactivated prematurely when performing a Conspicuous Action. Blood Rush deactivates after use and is disabled for the remainder of the Trial once the Exit Gates are powered."
  },
  "boil over": {
    name: "Boil Over",
    role: "Survivor",
    character: "Kate Denson",
    description: "While being carried by the Killer, the following effects apply: Increases the strength of the Struggle Effects on the Killer from your Wiggling by 60/70/80 %. Suppresses the ability of the Killer to read the Auras of all Hooks within 16 metres. Grants +33 % of your current Wiggle progression upon landing, if the Killer drops from height."
  },
  "bond": {
    name: "Bond",
    role: "Survivor",
    character: "Dwight Fairfield",
    description: "Unlocks potential in your Aura-reading ability: The Auras of all other Survivors are revealed to you within 20/28/36 metres."
  },
  "boon: circle of healing": {
    name: "Boon: Circle of Healing",
    role: "Survivor",
    character: "Mikaela Reid",
    description: "Press and hold the Active Ability button on a Dull or Hex Totem to bless it and create a Boon Totem. All Survivors within 24 metres hear soft chimes ringing out and benefit from its Boon Effects: Increases the Altruistic Healing speeds by 50/75/100 % when not using a Med-Kit. If a Survivor is injured, their Aura is revealed to all other Survivors. Survivors can only be affected by one instance of Boon: Circle of Healing at a time. Only one Totem can be blessed by your Boon Perks at a time and all of their effects are active on the same Boon Totem."
  },
  "boon: dark theory": {
    name: "Boon: Dark Theory",
    role: "Survivor",
    character: "Yoichi Asakawa",
    description: "Press and hold the Active Ability button on a Dull or Hex Totem to bless it and create a Boon Totem. All Survivors within 24 metres hear soft chimes ringing out and benefit from its Boon Effects: Grants a +3 % Haste Status Effect. This effect lingers for 2/3/4 seconds after leaving the Boon Totem's range. Only one Totem can be blessed by your Boon Perks at a time and all of their effects are active on the same Boon Totem."
  },
  "boon: exponential": {
    name: "Boon: Exponential",
    role: "Survivor",
    character: "Jonah Vasquez",
    description: "Press and hold the Active Ability button on a Dull or Hex Totem to bless it and create a Boon Totem. All Survivors within 24 metres hear soft chimes ringing out and benefit from its Boon Effects: Increases the Recovery speed while in the Dying State by 90/95/100 %. Unlocks the Self-Recovery ability, allowing them to fully recover from the Dying State. Only one Totem can be blessed by your Boon Perks at a time and all of their effects are active on the same Boon Totem."
  },
  "boon: illumination": {
    name: "Boon: Illumination",
    role: "Survivor",
    character: "Alan Wake",
    description: "Press and hold the Active Ability button on a Dull or Hex Totem to bless it and create a Boon Totem. All Survivors within 24 metres hear soft chimes ringing out and benefit from its Boon Effects: The Auras of all Chests and Generators are highlighted to you in blue. Increases your Action speeds for Blessing and Cleansing by 6/8/10 % while you have a lit Boon Totem. Survivors can only be affected by one instance of Boon: Illumination at a time. Only one Totem can be blessed by your Boon Perks at a time and all of their effects are active on the same Boon Totem."
  },
  "boon: shadow step": {
    name: "Boon: Shadow Step",
    role: "Survivor",
    character: "Mikaela Reid",
    description: "Press and hold the Active Ability button on a Dull or Hex Totem to bless it and create a Boon Totem. All Survivors within 24 metres hear soft chimes ringing out and benefit from its Boon Effects: Scratch Marks are suppressed. Auras are hidden from The Killer. Both effects linger for 2/3/4 seconds after leaving the Boon Totem's range. Only one Totem can be blessed by your Boon Perks at a time and all of their effects are active on the same Boon Totem."
  },
  "borrowed time": {
    name: "Borrowed Time",
    role: "Survivor",
    character: "Bill Overbeck",
    description: "Whenever you unhook another Survivor, they benefit from the following effects: Extends the duration of the Endurance Status Effect by 6/8/10 seconds to 21/23/25 seconds. Endurance is cancelled prematurely when performing a Conspicuous Action of any kind. Extends the duration of the Haste Status Effect by +10 seconds to 25 seconds."
  },
  "botany knowledge": {
    name: "Botany Knowledge",
    role: "Survivor",
    character: "Claudette Morel",
    description: "You benefit from the following permanent effect: Increases your Healing speed by 30/40/50 %."
  },
  "bound by obsession": {
    name: "Bound by Obsession",
    role: "Survivor",
    character: "All",
    description: "Whenever the Killer reads your Aura, Bound by Obsession activates for the same duration as their Aura-reading action: The Aura of the Killer is revealed to you. Increases your Action speeds for Cleansing, Healing, and Repairing actions by 2/4/6 %. If you are the Killer's current Obsession, the following effect triggers automatically every 30 seconds: Your Aura is revealed to the Killer for 3 seconds. Increases your chance of becoming the initial Obsession by increasing the default value by +100 %."
  },
  "breakdown": {
    name: "Breakdown",
    role: "Survivor",
    character: "Jeff Johansen",
    description: "After you are unhooked by any means, Breakdown triggers its effects: Instantly breaks that Hook. Increases its Auto-Repair timer to 180 seconds. The Aura of the Killer is revealed to you for 4/5/6 seconds."
  },
  "breakout": {
    name: "Breakout",
    role: "Survivor",
    character: "Yui Kimura",
    description: "While within 5 metres of the Killer carrying another Survivor, the following effects apply: Grants you a 6/8/10 % Haste Status Effect. Increases the Wiggling speed of the carried Survivor by +25 %. Survivors can only be affected by one instance of Breakout at a time."
  },
  "buckle up": {
    name: "Buckle Up",
    role: "Survivor",
    character: "Ash Williams",
    description: "Whenever you are healing a dying Survivor, Buckle Up activates: During the Healing action, you and the dying Survivor benefit from the following primary effect: The Aura of the Killer is revealed to you both. After completing the Healing action, the other Survivor benefits from the following secondary effects for 3/4/5 seconds: Suppresses the creation of their Scratch Marks. Grants them a +50 % Haste Status Effect. Buckle Up does not cause the Exhausted Status Effect."
  },
  "built to last": {
    name: "Built to Last",
    role: "Survivor",
    character: "Felix Richter",
    description: "While hiding inside a Locker with a depleted Item equipped, Built to Last triggers the following effect after 12/10/8 seconds: Recharges the Item to one of the following percentages: First time: 99 %. Second time: 66 %. Third time: 33 %. Built to Last is disabled for the remainder of the Trial after triggering its effect for the third time."
  },
  "calm spirit": {
    name: "Calm Spirit",
    role: "Survivor",
    character: "Jake Park",
    description: "You experience the following effects during a Trial: Nearby Crows no longer fly off and alert others to your presence, unless you come within touching distance. Suppresses the urge to scream from any cause at all times. Suppresses all noises related to interacting with the following Props: Chests, Totems. Reduces the Action speeds for Blessing, Cleansing, and Unlocking by 40/35/30 %."
  },
  "camaraderie": {
    name: "Camaraderie",
    role: "Survivor",
    character: "Steve Harrington",
    description: "If you are hooked and enter the Struggle Phase, Camaraderie activates: Pauses the Struggle Phase timer for 26/30/34 seconds as soon as any Survivor comes within 16 metres of your Hook."
  },
  "champion of light": {
    name: "Champion of Light",
    role: "Survivor",
    character: "Alan Wake",
    description: "While shining a Flashlight, Champion of Light triggers its primary effect: Grants a +50 % Haste Status Effect. After blinding the Killer by any means, Champion of Light triggers its secondary effect: Causes the Killer to suffer from a -20 % Hindered Status Effect for 6 seconds. This effect does not stack. Champion of Light applies a cool-down of 60/50/40 seconds after blinding the Killer."
  },
  "change of plan": {
    name: "Change of Plan",
    role: "Survivor",
    character: "Dustin Henderson",
    description: "You start the Trial with 2 Tokens. While hiding inside a Locker and holding a non-event Toolbox, press Active Ability button to spend 1 Token and transform your Item into a Med-Kit of the same rarity with a random add-on of the same rarity. The new Med-kit has 80/90/100 seconds of its charges."
  },
  "chemical trap": {
    name: "Chemical Trap",
    role: "Survivor",
    character: "Ellen Ripley",
    description: "After repairing Generators for a total of 20 %, Chemical Trap activates: Press the Active Ability button while near a dropped Pallet to install a Trap, which stays active for 40/50/60 seconds. When the Killer breaks the Trapped Pallet, its Trap explodes, spraying the Killer with a chemical compound: Causes the Killer to suffer from a -50 % Hindered Status Effect for 4 seconds. Chemical Trap deactivates after triggering successfully or once the timer runs out. The Auras of Trapped Pallets are revealed to all Survivors in yellow."
  },
  "clairvoyance": {
    name: "Clairvoyance",
    role: "Survivor",
    character: "Mikaela Reid",
    description: "After cleansing or blessing a Totem, Clairvoyance activates. While active, press and hold the Use Item button when empty-handed to unlock your full Aura-reading potential: The Auras of the following objects within 64 metres are revealed to you for as long as you uphold the interaction, up to a maximum of 10/11/12 seconds: Chests, Exit Gate Switches, Generators, Hatch, Hooks."
  },
  "clean break": {
    name: "Clean Break",
    role: "Survivor",
    character: "Taurie Cain",
    description: "After completing a Healing action on another Survivor, Clean Break activates. Press the Active Ability button while being healed by another Survivor to trigger the following effects: Suffer from the Broken Status Effect. You are automatically healed 1 Health State after 80/70/60 seconds. This effect is cancelled prematurely if you enter the Dying State. Clean Break does not activate if you already suffer from Broken. Clean Break deactivates after healing you."
  },
  "come and get me!": {
    name: "Come and Get Me!",
    role: "Survivor",
    character: "Rick Grimes",
    description: "After unhooking a Survivor, while crouched and stationary, press the Active Ability button to trigger the following effects: Suppresses the creation of Grunts of Pain, Pools of Blood, and Scratch Marks for all injured or dying Survivors within 24 metres of your location for the next 10/12.5/15 seconds. Causes you to scream and reveal your Aura to the Killer for 5 seconds."
  },
  "conviction": {
    name: "Conviction",
    role: "Survivor",
    character: "Michonne Grimes",
    description: "After having completed a Healing action on another Survivor, whenever you are in the Dying State, Conviction activates. While active, press the Active Ability button after reaching at least 25 % Recovery progress to trigger the following effects: Unlocks the Self-Recovery ability, allowing you to fully recover from the Dying State. Inflicts the Broken Status Effect. Causes you to automatically re-enter the Dying State after 20/25/30 seconds."
  },
  "corrective action": {
    name: "Corrective Action",
    role: "Survivor",
    character: "Jonah Vasquez",
    description: "You start the Trial with 1/2/3 Token(s) and succeeding a Great Skill Check grants +1 Token, up to a maximum of 5 Tokens. While any other Survivor performs a skilful interaction that can trigger Skill Checks, they benefit from the following effects: Converts any Failed Skill Check into a Good Skill Check. This consumes -1 Token. The Aura of that Survivor is revealed to you for 6 seconds. Corrective Action does not apply to special Skill Checks."
  },
  "counterforce": {
    name: "Counterforce",
    role: "Survivor",
    character: "Jill Valentine",
    description: "You benefit from the following permanent effect: Increases the default value of your Cleansing speed to 125 %. Whenever you cleanse a Totem, Counterforce triggers the following effects: Increases your Cleansing speed by a stack-able +25 %. The Aura of the Totem farthest from your current location is revealed to you for 10/12/14 seconds."
  },
  "cross-examination": {
    name: "Cross-Examination",
    role: "Survivor",
    character: "Shane Wiigwaas",
    description: "While inside the Killer's Terror Radius, the Killer leaves behind Light Marks that you can see. Light Marks have a duration of 10 seconds. While standing on a Light Mark, gain Elusive Status Effect. This lingers for 3/4/5 seconds."
  },
  "cut loose": {
    name: "Cut Loose",
    role: "Survivor",
    character: "Thalita Lyra",
    description: "After performing a Rushed Vault action while being chased, Cut Loose activates for 4/5/6 seconds: Suppresses all noises related to the Rushed Vault action, including the Loud Noise Notification for the Killer. While active, performing another Rushed Vault action resets the timer each time. Cut Loose has a cool-down of 45 seconds after use and the timer has elapsed."
  },
  "dance with me": {
    name: "Dance With Me",
    role: "Survivor",
    character: "Kate Denson",
    description: "When performing a Rushed action to vault a Window or exit a Locker, Dance With Me triggers its effect: Suppresses the creation of your Scratch Marks for 5 seconds. Dance With Me has a cool-down of 20/20/15 seconds."
  },
  "dark sense": {
    name: "Dark Sense",
    role: "Survivor",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability. Whenever a Generator is completed, Dark Sense activates: The Aura of the Killer is revealed to you for 5/7/10 seconds once they come within 24 metres of your location. Dark Sense deactivates after use."
  },
  "dead hard": {
    name: "Dead Hard",
    role: "Survivor",
    character: "David King",
    description: "After being unhooked by any means, Dead Hard activates: While injured and running, press the Active Ability button to trigger the following effect: Grants the Endurance Status Effect for 0.5 seconds. Dead Hard cannot be used while Exhausted. Dead Hard causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "deadline": {
    name: "Deadline",
    role: "Survivor",
    character: "Alan Wake",
    description: "Whenever you are in the Injured State, Deadline activates: Increases the Odds of triggering Skill Checks by 6/8/10 % while repairing or healing. Causes Skill Checks to appear in random places. Reduces the penalty for missed Skill Checks by -50 %."
  },
  "deception": {
    name: "Deception",
    role: "Survivor",
    character: "Élodie Rakoto",
    description: "Press and hold the Sprint button while interacting with a Locker for the following effects: Suppresses the creation of your Scratch Marks and Pools of Blood for 5 seconds. Causes you to run past the targeted Locker, instead of entering it. Causes its doors to swiftly open and close again, feining you having entered it in a rush. Triggers a Loud Noise Notification for the Killer at its location. Deception has a cool-down of 25/20/15 seconds."
  },
  "decisive strike": {
    name: "Decisive Strike",
    role: "Survivor",
    character: "Laurie Strode",
    description: "Identical to Will to Live."
  },
  "déjà vu": {
    name: "Déjà Vu",
    role: "Survivor",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability: The Auras of whichever 3 Generators are currently in closest proximity to one another are revealed to you. Increases your Repair speed on those Generators by 4/5/6 %."
  },
  "deliverance": {
    name: "Deliverance",
    role: "Survivor",
    character: "Adam Francis",
    description: "After safely unhooking another Survivor, Deliverance activates: Grants the ability to perform a successful Self-Unhook at any point during the first Hook Stage. Causes the Broken Status Effect for 100/80/60 seconds after unhooking yourself. Deliverance cannot be used during the second Hook Stage or if you are hooked as the Last Survivor Standing. Deliverance is disabled for the remainder of the Trial after use."
  },
  "desperate measures": {
    name: "Desperate Measures",
    role: "Survivor",
    character: "Felix Richter",
    description: "Whenever any Survivor, including yourself, is not in the Healthy State, Desperate Measures activates: Increases your Action speeds for Healing and Unhooking by a stack-able 16/18/20 % per injured, dying, or hooked Survivor, up to a maximum of 64/72/80 %."
  },
  "detective's hunch": {
    name: "Detective's Hunch",
    role: "Survivor",
    character: "David Tapp",
    description: "Unlocks potential in your Aura-reading ability. Whenever a Generator is completed, Detective's Hunch triggers its effect: The Auras of the following objects within 32/48/64 metres of your location are revealed to you for 20 seconds: Chests, Generators, Totems."
  },
  "distortion": {
    name: "Distortion",
    role: "Survivor",
    character: "Jeff Johansen",
    description: "Start the Trial with 1 Token. Whenever the Killer attempts to read your Aura, Distortion automatically consumes -1 Token to trigger the following effects for 8/10/12 seconds: Blocks your Aura from being read. Suppresses the creation of your Scratch Marks. Distortion recharges +1 Token every 15 seconds of being chased by the Killer, and can hold 2 Tokens. Distortion does not trigger its effects while in the Dying State."
  },
  "diversion": {
    name: "Diversion",
    role: "Survivor",
    character: "Adam Francis",
    description: "After staying in the Terror Radius without being chased for 30/25/20 seconds, Diversion activates. While active, press the Active Ability button while crouched and motionless to throw a pebble in the direction you are facing: Creates a distraction for the Killer at its landing location 20 metres away: Triggers a Loud Noise Notification. Creates fake Scratch Marks. Diversion deactivates after use."
  },
  "do no harm": {
    name: "Do No Harm",
    role: "Survivor",
    character: "Orela Rose",
    description: "When healing another Survivor, depending on their accumulated Hook Stages, you benefit from the following effects: Increases your Altruistic Healing speed by 30/40/50 % per Hook Stage, up to a maximum of 60/80/100 %. Increases the Progression bonus of Great Healing Skill Checks by +3 % per Hook Stage, up to a maximum of +6 %."
  },
  "down to the last": {
    name: "Down to the Last",
    role: "Survivor",
    character: "All",
    description: "Each time a Survivor other than yourself is killed or sacrificed, Down to the Last gains 1 Token, up to a maximum of 3 Tokens: Grants a stack-able radius of 20/22/24 metres per Token around you, up to a maximum of 60/66/72 metres, within which you are immune to the Killer's Aura-reading abilities. When you are the Last Survivor Standing, you benefit from the following effects: Increases your Repair speed by +75 %. Increases your Gate and Hatch Opening speeds by +50 %. Increases your chance of becoming the initial Obsession by increasing the default value by +100 %."
  },
  "dramaturgy": {
    name: "Dramaturgy",
    role: "Survivor",
    character: "Nicolas Cage",
    description: "Whenever you are at full health, Dramaturgy activates. While active, press the Active Ability button while running to run with knees high for 0.5 seconds before benefitting from the following primary effect: Grants a +25 % Haste Status Effect for 2 seconds. Afterwards, Dramaturgy triggers any one of the following secondary effects, but never the same one twice in a row: Grants a second instance of the primary Haste Status Effect. Inflicts the Exposed Status Effect for 12 seconds. Causes you to scream. Grants a randomly selected Rare Item pre-equipped with a random selection of Add-ons. This causes you to automatically drop any previously held Item. Dramaturgy cannot be used while Exhausted. Dramaturgy causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "duty of care": {
    name: "Duty of Care",
    role: "Survivor",
    character: "Orela Rose",
    description: "While healthy, taking a Protection Hit causes all other Survivors within 12 metres of your location to benefit from the following effect: Grants them a +25 % Haste Status Effect for 4/5/6 seconds."
  },
  "empathic connection": {
    name: "Empathic Connection",
    role: "Survivor",
    character: "Yoichi Asakawa",
    description: "You benefit from the following permanent primary effect: Increases your Altruistic Healing speed by 25/30/35 %. Whenever any other Survivor is injured, Empathic Connection applies its secondary effect: Your Aura as a potential Healer is revealed to them."
  },
  "empathy": {
    name: "Empathy",
    role: "Survivor",
    character: "Claudette Morel",
    description: "Unlocks potential in your Aura-reading ability: The Auras of injured or dying Survivors are revealed to you within 64/96/128 metres."
  },
  "extrasensory perception": {
    name: "Extrasensory Perception",
    role: "Survivor",
    character: "Eleven",
    description: "Crouch for 4 seconds to activate this perk. While active: You see the Auras of Survivors, the Killer, and a variety of objects. These are revealed in an expanding 44 metre radius. Revealed objects include Chests, Exit Gates, Generators, Hatch, Items, Pallets, Totems, and Windows. You gain Elusive and Oblivious Status Effects. When you stop crouching, or after 11 seconds, all effects of this perk end and it enters a 60/50/40 seconds cooldown."
  },
  "exultation": {
    name: "Exultation",
    role: "Survivor",
    character: "Trevor Belmont",
    description: "While holding an Item, stunning the Killer by dropping a Pallet causes the following effects: Recharges the Item by +75 %. Upgrades its Rarity to the next available Tier. Exultation has a cool-down of 30/25/20 seconds."
  },
  "eyes of belmont": {
    name: "Eyes of Belmont",
    role: "Survivor",
    character: "Trevor Belmont",
    description: "Whenever a Generator is completed, the Aura of the Killer is revealed to you for 1/2/3 seconds. Extends the duration of all instances of the Killer's Aura being revealed to you by +2 seconds. Eyes of Belmont benefits from its own effect."
  },
  "fast track": {
    name: "Fast Track",
    role: "Survivor",
    character: "Yun-Jin Lee",
    description: "Whenever you unhook a Survivor, Fast Track is granted 1 Token, up to a maximum of 1/2/3 Token(s). Succeeding a Great Repair Skill Check consumes all accumulated Tokens. Permanently reduces the Repair Charges requirement of that Generator by 5 charges per Token."
  },
  "finesse": {
    name: "Finesse",
    role: "Survivor",
    character: "Lara Croft",
    description: "Whenever you are healthy, Finesse activates: Increases your Vaulting speed for a Fast Vault by +20 %. Finesse has a cool-down of 40/35/30 seconds after performing a Fast Vault."
  },
  "five moves ahead": {
    name: "Five Moves Ahead",
    role: "Survivor",
    character: "Kwon Tae-young",
    description: "This perk activates while you are being chased by the Killer or are inside the Killer's Terror Radius: After you drop a Pallet, you start moving 50 % earlier. See the auras of the 5 closest Pallets and Windows. This perk goes on a 40/35/30 seconds cool-down when you drop a Pallet."
  },
  "fixated": {
    name: "Fixated",
    role: "Survivor",
    character: "Nancy Wheeler",
    description: "You benefit from the following permanent effects: Increases your Walking speed by 10/15/20 %. Unlocks the ability to see your own Scratch Marks."
  },
  "flashbang": {
    name: "Flashbang",
    role: "Survivor",
    character: "Leon Scott Kennedy",
    description: "After repairing Generators for a total of 50/45/40 %, Flashbang activates: Press the Active Ability button while hiding inside a Locker to craft a Flash Grenade. Flashbang deactivates after use."
  },
  "flip-flop": {
    name: "Flip-Flop",
    role: "Survivor",
    character: "Ash Williams",
    description: "Recovering in the Dying State also charges the Wiggle Meter at 50 % of the Recovery rate and up to a maximum of 40/45/50 % of Wiggle Progression."
  },
  "flow state": {
    name: "Flow State",
    role: "Survivor",
    character: "Kwon Tae-young",
    description: "Whenever a Generator is completed, gain a token, up to 5. For each token: Bless and cleanse Totems 8/9/10 % faster. Heal 8/9/10 % faster. Unhook Survivors 8/9/10 % faster."
  },
  "fogwise": {
    name: "Fogwise",
    role: "Survivor",
    character: "Vittorio Toscano",
    description: "Unlocks potential in your Aura-reading ability while repairing Generators: The Aura of the Killer is revealed to you for 4/5/6 seconds after succeeding a Great Repair Skill Check."
  },
  "for the people": {
    name: "For the People",
    role: "Survivor",
    character: "Zarina Kassir",
    description: "While healthy and healing another Survivor without using a Med-Kit, press the Active Ability button to trigger the following effects: Trade 1 Health State with the other Survivor: Instantly heals them to the Injured State, if they were dying or suffering from the Deep Wound Status Effect. Instantly heals them to full health, if they were injured. You yourself become injured and suffer from the Broken Status Effect for 80/70/60 seconds. You become the Killer's Obsession, if not already. Reduces your chance of becoming the initial Obsession by reducing the default value by -100 %."
  },
  "friendly competition": {
    name: "Friendly Competition",
    role: "Survivor",
    character: "Thalita Lyra",
    description: "Each time you complete a Generator together with at least one other Survivor, Friendly Competition activates: Increases the Repair speed of all participating Survivors, including yourself, by +5 % for 100/110/120 seconds."
  },
  "ghost notes": {
    name: "Ghost Notes",
    role: "Survivor",
    character: "Vee Boonyasak",
    description: "While suffering from the Exhausted Status Effect, you benefit from the following effects: Causes your Scratch Marks to disappear +50 % faster. Increases your Recovery rate from that Status Effect by 5/7.5/10 %. Ghost Notes does not cause the Exhausted Status Effect."
  },
  "hardened": {
    name: "Hardened",
    role: "Survivor",
    character: "Lara Croft",
    description: "After unlocking a Chest and either blessing or cleansing a Totem, Hardened activates: Suppresses the urge to scream from any cause and instead causes the Aura of the Killer to be revealed to you for 3/4/5 seconds."
  },
  "head on": {
    name: "Head On",
    role: "Survivor",
    character: "Jane Romero",
    description: "After hiding in a Locker for 3 seconds, Head On activates. While active, hold the Sprint button while exiting the Locker to trigger its effect: Causes you to forcefully launch yourself from the Locker, stunning the Killer if they are too close to it: Has a Stun range of 2.5 metres. Has a Stun duration of 3 seconds. Triggers a Loud Noise Notification for the Killer upon missing. Head On cannot be used while Exhausted. Head On causes the Exhausted Status Effect for 60/50/40 seconds on a successful stun."
  },
  "hope": {
    name: "Hope",
    role: "Survivor",
    character: "All",
    description: "Once the Exit Gates are powered, Hope activates for the remainder of the Trial: Grants a 3/4/5 % Haste Status Effect."
  },
  "hyperfocus": {
    name: "Hyperfocus",
    role: "Survivor",
    character: "Rebecca Chambers",
    description: "Succeeding a Great Skill Check while repairing or healing grants +1 Token, up to a maximum of 6 Tokens: Increases the Skill Check Trigger odds and Pointer-Rotation speed by +4 % per Token each, up to a maximum of +24 %. Increases the Skill Check Bonus progression by 10/20/30 % of its base value per Token, up to a maximum of 60/120/180 %. Hyperfocus loses all Tokens after succeeding just a Good Skill Check, failing one, or if the action is interrupted by any means."
  },
  "inner focus": {
    name: "Inner Focus",
    role: "Survivor",
    character: "Haddie Kaur",
    description: "Grants the ability to see the Scratch Marks of other Survivors. Whenever another Survivor loses a Health State due to the Killer, the Aura of the latter is revealed to you for 6/8/10 seconds."
  },
  "inner strength": {
    name: "Inner Strength",
    role: "Survivor",
    character: "Nancy Wheeler",
    description: "After cleansing a Totem of any kind, Inner Strength activates. While active, hiding inside a Locker for 10/9/8 seconds triggers the following effect: Heals you to the next Health State. Inner Strength deactivates after use. Inner Strength cannot be used while suffering from the Broken Status Effect."
  },
  "invocation: treacherous crows": {
    name: "Invocation: Treacherous Crows",
    role: "Survivor",
    character: "Taurie Cain",
    description: "When in the Basement near the circle, press the Active Ability button to begin the Invocation, which takes 60 seconds to complete. During an Invocation, your Aura is revealed to all other Survivors and they can join in, accelerating the process by +100 %, if they too have an Invocation Perk equipped, or by +50 %, if they have not. Once the Invocation is completed, the following effects apply: Whenever the Killer scares a Crow while a Survivor is inside their Terror Radius, their Aura is revealed to all Survivors for 1/1.5/2 seconds. You automatically enter the Injured State from any previous Health State, and suffer from the Broken Status Effect for the remainder of the Trial."
  },
  "invocation: weaving spiders": {
    name: "Invocation: Weaving Spiders",
    role: "Survivor",
    character: "Sable Ward",
    description: "When in the Basement near the circle, press the Active Ability button to begin the Invocation, which takes 60 seconds to complete. During an Invocation, your Aura is revealed to all other Survivors and they can join in, accelerating the process by +100 %, if they too have an Invocation Perk equipped, or by +50 %, if they have not. Once the Invocation is completed, the following effects apply: Permanently reduces the Repair Charges requirement of all Generators in the Trial by 8/9/10 Charges. You automatically enter the Injured State from any previous Health State, and suffer from the Broken Status Effect for the remainder of the Trial. Completing this Invocation disables all other instances of Invocation: Weaving Spiders for the remainder of the Trial."
  },
  "iron will": {
    name: "Iron Will",
    role: "Survivor",
    character: "Jake Park",
    description: "While injured, you benefit from the following effects: Reduces the volume of Grunts of Pain by 80/90/100 %. Iron Will cannot be used while Exhausted, but does not cause the Status Effect."
  },
  "kindred": {
    name: "Kindred",
    role: "Survivor",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability. Whenever any Survivor is hooked, Kindred activates and applies the following effects: The Aura of the Killer is revealed to all Survivors whenever the Killer comes within 8/12/16 metres of the Hook. If you are the Hooked Survivor, the Auras of all Survivors are revealed to each other. If you are not the Hooked Survivor, the Auras of all other Survivors are only revealed to you."
  },
  "last stand": {
    name: "Last Stand",
    role: "Survivor",
    character: "Michonne Grimes",
    description: "After staying in the Terror Radius without being chased for 120/105/90 seconds, Last Stand activates. While active, perform a Rushed Vault action to trigger its effect: Stuns the Killer for 3 seconds, if they are within 2.5 metres of that Vault location. Last Stand is disabled for the remainder of the Trial after use."
  },
  "leader": {
    name: "Leader",
    role: "Survivor",
    character: "Dwight Fairfield",
    description: "All other Survivors within 10 metres of your location benefit from the following effect: Increases their Action speeds for Cleansing, Gate-Opening, Healing, Sabotaging, Unhooking, and Unlocking by 20/25/30 %. This effect lingers for 15 seconds after leaving its Area of Effect. Survivors can only be affected by one instance of Leader at a time."
  },
  "left behind": {
    name: "Left Behind",
    role: "Survivor",
    character: "Bill Overbeck",
    description: "Once you are the Last Survivor Standing, Left Behind activates: The Aura of the Hatch is revealed to you within 24/28/32 metres."
  },
  "lend a hand": {
    name: "Lend a Hand",
    role: "Survivor",
    character: "Shane Wiigwaas",
    description: "Cleansing or Blessing a Totem activates this perk: Once per Survivor, while healing a Survivor, press Activate Ability 2 to give the healed Survivor 2/3/4 permanent healing charges."
  },
  "light-footed": {
    name: "Light-Footed",
    role: "Survivor",
    character: "Ellen Ripley",
    description: "Whenever you are healthy, Light-Footed activates: Suppresses the sound of your footsteps while running. Light-Footed has a cool-down of 14/12/10 seconds after performing a Rush Vault action."
  },
  "lightweight": {
    name: "Lightweight",
    role: "Survivor",
    character: "All",
    description: "Reduces the Lifetime of your Scratch Marks by 3/4/5 seconds. Reduces the Spawn chance of patches of Scratch Marks by -60 %, making their spacing inconsistent."
  },
  "lithe": {
    name: "Lithe",
    role: "Survivor",
    character: "Feng Min",
    description: "Whenever you perform a Rushed Vault action, Lithe triggers its effect: Grants a +50 % Haste Status Effect for 3 seconds. Lithe cannot be used while Exhausted. Lithe causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "low profile": {
    name: "Low Profile",
    role: "Survivor",
    character: "Ada Wong",
    description: "Whenever you are the only Survivor in the Trial not currently incapacitated by either being downed, carried, or hooked, Low Profile activates: Suppresses your Grunts of Pain and the creation of Pools of Blood and Scratch Marks for 70/80/90 seconds. Low Profile deactivates after use and only accounts for Survivors still participating in the Trial."
  },
  "lucky break": {
    name: "Lucky Break",
    role: "Survivor",
    character: "Yui Kimura",
    description: "Whenever you are in the Injured State, Lucky Break activates: Suppresses the creation of Pools of Blood and Scratch Marks for up to 40/50/60 seconds. Whenever you are healing another Survivor, Lucky Break recharges by the same amount of time spent performing the Healing action, up to its initial maximum. Lucky Break deactivates once its timer runs out or whenever your Health State updates to any other but the Injured State."
  },
  "lucky star": {
    name: "Lucky Star",
    role: "Survivor",
    character: "Ellen Ripley",
    description: "While hiding inside a Locker, you benefit from the following effect: Suppresses your Grunts of Pain. After exiting the Locker you benefit from the following effects for 30 seconds: Suppresses your Grunts of Pain and the creation of Pools of Blood. The Auras of all other Survivors are revealed to you. The Aura of the nearest Generator is revealed to you and highlighted in yellow. Lucky Star has a cool-down of 35/30/25 seconds."
  },
  "made for this": {
    name: "Made for This",
    role: "Survivor",
    character: "Gabriel Soma",
    description: "Whenever you are in the Injured State, Made for This activates. While active, completing a Healing action on another Survivor triggers the following primary effect: Grants the Endurance Status Effect for 6/8/10 seconds. Endurance is cancelled prematurely when performing a Conspicuous Action of any kind. While active and suffering from the Deep Wound Status Effect, running triggers the following secondary effect: Grants a 1/2/3 % Haste Status Effect."
  },
  "mettle of man": {
    name: "Mettle of Man",
    role: "Survivor",
    character: "Ash Williams",
    description: "After triggering a third Protection Hit by any means, Mettle of Man activates: While in the Injured State, Mettle of Man shields you from the next attack that would put you into the Dying State. After healing back to full health by any means, Mettle of Man reveals your Aura to the Killer whenever you are farther than 12/14/16 metres from their location. Mettle of Man deactivates after entering the Dying State by any means. Increases your chance of becoming the initial Obsession by increasing the default value by +100 %."
  },
  "mirrored illusion": {
    name: "Mirrored Illusion",
    role: "Survivor",
    character: "Aestri",
    description: "After repairing Generators for a total of 20 %, Mirrored Illusion activates: Press the Active Ability button when next to either a Chest, Exit Gate, Generator, or a Totem to spawn a Static Illusion that lasts for 40/50/60 seconds. Mirrored Illusion deactivates after triggering successfully."
  },
  "moment of glory": {
    name: "Moment of Glory",
    role: "Survivor",
    character: "Trevor Belmont",
    description: "After performing the Unlocking or Rummaging action on Chests a total of 2 times, Moment of Glory activates: When you become injured, you instantly suffer from the Broken Status Effect. You are automatically healed 1 Health State after 80/70/60 seconds. This effect is cancelled prematurely if you enter the Dying State. Moment of Glory does not activate if you already suffer from the Broken Status Effect. Moment of Glory deactivates after healing you."
  },
  "no mither": {
    name: "No Mither",
    role: "Survivor",
    character: "David King",
    description: "You suffer permanently from the Broken Status Effect in exchange for the following benefits: Suppresses the creation of Pools of Blood. Suppresses your Grunts of Pain while in the Injured State or in the Dying State. Unlocks the Self-Recovery ability, allowing you to fully recover from the Dying State: Increases the Recovery speed by 15/20/25 %."
  },
  "no one left behind": {
    name: "No One Left Behind",
    role: "Survivor",
    character: "All",
    description: "Once the Exit Gates are powered, No One Left Behind activates: The Auras of all other Survivors are revealed to you. Increases your Action speeds for Healing and Unhooking by 50/75/100 %. Increases the strength and duration of the Haste Status Effect granted to Survivors you unhook by +10 % and +5 seconds respectively: Causes them to benefit from a 20 % Haste Status Effect for 15 seconds."
  },
  "object of obsession": {
    name: "Object of Obsession",
    role: "Survivor",
    character: "Laurie Strode",
    description: "Identical to Bound by Obsession."
  },
  "off the record": {
    name: "Off the Record",
    role: "Survivor",
    character: "Zarina Kassir",
    description: "After being unhooked or unhooking yourself, Off the Record activates for 30/35/40 seconds: Blocks your Aura from being revealed. Suppresses your Grunts of Pain while in the Injured State. Suppresses the creation of your Scratch Marks. Grants the Endurance Status Effect. Endurance is cancelled prematurely when performing a Conspicuous Action of any kind. Off the Record deactivates prematurely and is disabled for the remainder of the Trial upon powering the Exit Gates."
  },
  "one-two-three-four!": {
    name: "One-Two-Three-Four!",
    role: "Survivor",
    character: "Vee Boonyasak",
    description: "While standing and idle, press the Active Ability button to start a Performance: Lasts for up to 15 seconds. Empowers Survivors within 16 metres of your location. Triggers continuous Skill Checks. After successfully completing the Performance, empowered Survivors performing Healing or Repairing actions benefit from the following effect for 90 seconds: Increases the chances of triggering Skill Checks by +20 %. One-Two-Three-Four! has a cool-down of 110/100/90 seconds after cancelling or completing the Performance."
  },
  "open-handed": {
    name: "Open-Handed",
    role: "Survivor",
    character: "Ace Visconti",
    description: "All Survivors benefit from the following permanent effect: Increases the radius of all Aura-reading abilities by 8/12/16 metres. Open-Handed only affects Auras that emanate from the Survivor causing them. Survivors can only be affected by one instance of Open-Handed at a time."
  },
  "overcome": {
    name: "Overcome",
    role: "Survivor",
    character: "Jonah Vasquez",
    description: "Whenever you enter the Injured State from full health, Overcome triggers its effect: Extends the duration of the On-hit Sprint boost by +2 seconds. Overcome cannot be used while Exhausted. Overcome causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "overzealous": {
    name: "Overzealous",
    role: "Survivor",
    character: "Haddie Kaur",
    description: "After cleansing or blessing a Totem, Overzealous activates: Dull Totem: Increases your Repair speed by 8/9/10 %. Hex Totem: Increases your Repair speed by 16/18/20 %. Overzealous deactivates after losing a Health State by any means."
  },
  "parental guidance": {
    name: "Parental Guidance",
    role: "Survivor",
    character: "Yoichi Asakawa",
    description: "After stunning the Killer by any means, Parental Guidance triggers its effect: Suppresses your Grunts of Pain and the creation of Scratch Marks and Pools of Blood for 5/6/7 seconds."
  },
  "pharmacy": {
    name: "Pharmacy",
    role: "Survivor",
    character: "Quentin Smith",
    description: "While unlocking a Chest, you benefit from the following effects: Increases the Unlocking speed by 75/100/125 %. Reduces the audible range of all noises related to the Unlocking interaction by -12 metres. Guarantees an Emergency Med-Kit after completing the interaction."
  },
  "plot twist": {
    name: "Plot Twist",
    role: "Survivor",
    character: "Nicolas Cage",
    description: "Whenever you are in the Injured State, Plot Twist activates. While active, press the Active Ability button while crouching and stationary to trigger the following primary effects: Silently enter the Dying State without notifying the Killer. Suppresses your Grunts of Pain and the creation of Pools of Blood. Unlocks the Self-Recovery ability, allowing you to fully recover from the Dying State: Increases the Recovery speed by +25 %. After self-recovering from the Dying State, you benefit from the following secondary effects: Instantly heals you to full health. Grants a +50 % Haste Status Effect for 2/3/4 seconds. Plot Twist is disabled after recovering by any means, but can be reactivated once more upon powering the Exit Gates."
  },
  "plunderer's instinct": {
    name: "Plunderer's Instinct",
    role: "Survivor",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability: The Auras of the following objects are revealed to you within 32/48/64 metres: Closed Chests located in the environment. Items sitting inside opened Chests. Items dropped in the environment. When unlocking or rummaging through Chests, you benefit from the following effect: Increases the chances of finding rarer Items by +50 %."
  },
  "poised": {
    name: "Poised",
    role: "Survivor",
    character: "Jane Romero",
    description: "Whenever a Generator is completed, Poised triggers its primary effect: Suppresses the creation of your Scratch Marks for 20/25/30 seconds. Whenever you start repairing a Generator for the first time, Poised triggers its secondary effect: The Aura of the Killer is revealed to you for 8 seconds."
  },
  "potential energy": {
    name: "Potential Energy",
    role: "Survivor",
    character: "Vittorio Toscano",
    description: "While repairing a Generator, press the Active Ability button to Store Potential Energy: Repair Charges no longer progress the Generator and are instead converted into Tokens: Gain 1 Token for the equivalent of 1 % Progression, up to a maximum of 10/15/20 Tokens. Failed Repair Skill Checks incur a penalty depending on how many Tokens have been accumulated: Not at Token Limit: Reduces the number of accumulated Tokens by -20 %. At Token Limit: Regresses the Generator by -10 %. Having accumulated at least 1 Token, press the Active Ability button again on the same or a different Generator to Release Potential Energy: Consumes all accumulated Tokens. Instantly progresses that Generator by +1 % per Token. Potential Energy deactivates after use or losing a Health State by any means, and will lose all accumulated Tokens in case of the latter."
  },
  "power struggle": {
    name: "Power Struggle",
    role: "Survivor",
    character: "Élodie Rakoto",
    description: "Whenever you are in the Dying State, you benefit from the following primary effect: The Auras of upright Pallets are revealed to you. After reaching 25/20/15 % of Wiggle progression, Power Struggle unlocks the following secondary effect: Grants the ability to drop a nearby Pallet while being carried by the Killer. Stuns the Killer and causes them to release you from their grasp. Power Struggle deactivates after use."
  },
  "premonition": {
    name: "Premonition",
    role: "Survivor",
    character: "All",
    description: "Projects an invisible cone in the direction you are looking, with a Detection angle of 45 ° and a range of 36 metres: Triggers an audio cue when detecting the Killer within it. Premonition has a cool-down of 60/45/30 seconds."
  },
  "prove thyself": {
    name: "Prove Thyself",
    role: "Survivor",
    character: "Dwight Fairfield",
    description: "Increases the Repair speed by a stack-able 6/8/10 % per other Survivor within 4 metres of your location, up to a maximum of 18/24/30 %. Prove Thyself extends its effect to all Survivors within its range. Survivors can only be affected by one instance of Prove Thyself at a time."
  },
  "quick & quiet": {
    name: "Quick & Quiet",
    role: "Survivor",
    character: "Meg Thomas",
    description: "When performing a Rushed action to vault across Pallets or Windows, or to enter or exit Lockers, Quick & Quiet triggers its effect: Suppresses all noises related to those interactions and the accompanying Loud Noise Notification. Quick & Quiet has a cool-down of 25/20/15 seconds."
  },
  "quick gambit": {
    name: "Quick Gambit",
    role: "Survivor",
    character: "Vittorio Toscano",
    description: "While being chased by the Killer, the following effects apply: The Auras of other Survivors are revealed to you. Increases the Repair speed of other Survivors by 3/4/5 %. Quick Gambit has a cool-down of 40 seconds upon losing a Health State."
  },
  "rapid response": {
    name: "Rapid Response",
    role: "Survivor",
    character: "Orela Rose",
    description: "Whenever you become afflicted by the Exhausted Status Effect, Rapid Response triggers its effect: The Aura of the Killer is revealed to you for 2 seconds. Perform a Rushed action to exit a Locker to voluntarily trigger the Status Effect for 30/25/20 seconds. Rapid Response cannot be used to override an existing Exhausted Status Effect."
  },
  "reactive healing": {
    name: "Reactive Healing",
    role: "Survivor",
    character: "Ada Wong",
    description: "Whenever another Survivor within 32 metres of your location loses a Health State by any means while you are in the Injured State, you benefit from the following effect: Grants 40/45/50 % of your missing Healing Progression towards your Health Bar."
  },
  "reassurance": {
    name: "Reassurance",
    role: "Survivor",
    character: "Rebecca Chambers",
    description: "While within 6 metres of a hooked Survivor, press the Active Ability button to trigger the following effects for 20/25/30 seconds: Pauses the Sacrifice Process. This also pauses the Struggle Skill Checks for Survivors in the Struggle Phase. Causes the outline of that Survivor to be highlighted in white. Reassurance can only be used once per Survivor per Hook Instance."
  },
  "red herring": {
    name: "Red Herring",
    role: "Survivor",
    character: "Zarina Kassir",
    description: "After repairing a Generator for at least 1 second, Red Herring triggers its primary effect: The Aura of that Generator is highlighted to you in yellow. The highlight persists until either of the following occurs: The Generator is completed. You start repairing a different Generator. You enter a Locker. When entering a Locker, Red Herring triggers its secondary effect: Triggers a Loud Noise Notification for the Killer on the highlighted Generator. Red Herring has a cool-down of 25/20/15 seconds."
  },
  "repressed alliance": {
    name: "Repressed Alliance",
    role: "Survivor",
    character: "Cheryl Mason",
    description: "After repairing Generators for a total of 55/50/45 seconds, Repressed Alliance activates: Press the Active Ability button to call upon The Entity to block the Generator you are currently repairing for 30 seconds, after which Repressed Alliance deactivates. The Aura of the blocked Generator is revealed to all Survivors in white. Repressed Alliance can only be triggered when no other Survivors are repairing your Generator."
  },
  "residual manifest": {
    name: "Residual Manifest",
    role: "Survivor",
    character: "Haddie Kaur",
    description: "After a successful Killer Blind, the Killer suffers from the Blindness Status Effect for 20/25/30 seconds. Residual Manifest grants the ability to rummage through an opened Chest once per Trial and will guarantee a basic Flashlight."
  },
  "resilience": {
    name: "Resilience",
    role: "Survivor",
    character: "All",
    description: "Whenever you are in the Injured State, Resilience activates: Increases the Action speeds for the following interactions by 3/6/9 %: Blessing or Cleansing Totems. Healing yourself or other Survivors. Opening Exit Gates. Repairing Generators. Sabotaging Hooks. Searching Chests. Unhooking other Survivors. Vaulting Windows."
  },
  "resurgence": {
    name: "Resurgence",
    role: "Survivor",
    character: "Jill Valentine",
    description: "After you are unhooked by any means, Resurgence triggers the following effect: Grants you 50/60/70 % of Healing progression."
  },
  "road life": {
    name: "Road Life",
    role: "Survivor",
    character: "Vee Boonyasak",
    description: "While injured and repairing a Generator, regular Skill Checks have the following effects: Gain +1 Token for Great Repair Skill Checks. Gain 0 Tokens for Good Repair Skill Checks. Lose -1 Token for Failed Repair Skill Checks. Once you accumulate 6/5/4 Tokens, consume all Tokens to benefit from the following effect: Increases your Healing speed by +100 % until you stop healing. Road Life deactivates after use and does not activate while suffering from the Broken Status Effect. Road Life does not interact with special Skill Checks triggered by outside effects."
  },
  "rookie spirit": {
    name: "Rookie Spirit",
    role: "Survivor",
    character: "Leon Scott Kennedy",
    description: "While repairing Generators, succeed 5/4/3 Good or Great Skill Checks to activate Rookie Spirit for the remainder of the Trial: The Auras of any regressing Generators are revealed to you until they stop regressing by any means."
  },
  "saboteur": {
    name: "Saboteur",
    role: "Survivor",
    character: "Jake Park",
    description: "Unlocks potential in your Aura-reading ability: While the Killer is carrying another Survivor, the Auras of all Hooks within 56 metres of their original Pick-up location are revealed to you: The Auras of normal Hooks are white. The Auras of Scourge Hooks are yellow. Unlocks the ability to sabotage Hooks without Toolboxes: Increases the Sabotage speed without a Toolbox by +30 %. This effect has a cool-down of 70/65/60 seconds after use."
  },
  "scavenger": {
    name: "Scavenger",
    role: "Survivor",
    character: "Gabriel Soma",
    description: "While holding a depleted Toolbox, Scavenger activates: Succeeding at Great Repairing Skill Checks grants 1 Token, up to a maximum of 5 Tokens. Reaching the maximum number of Tokens automatically consumes them and fully recharges the Toolbox. Recharging a Toolbox will reduce your Repair speed by -50 % for the next 40/35/30 seconds. Scavenger grants the ability to rummage through an opened Chest once per Trial and will guarantee a basic Toolbox."
  },
  "scene partner": {
    name: "Scene Partner",
    role: "Survivor",
    character: "Nicolas Cage",
    description: "Whenever you are inside the Terror Radius, Scene Partner activates: Looking at the Killer causes you to scream, which reveals their Aura for 4/5/6 seconds. There is a chance of 50 % that you will scream again, extending the Aura-reveal duration by another +2 seconds. Scene Partner has a cool-down of 40 seconds."
  },
  "second wind": {
    name: "Second Wind",
    role: "Survivor",
    character: "Steve Harrington",
    description: "When you heal another Survivor for the equivalent of 1 Health State, Second Wind activates: The next time you are unhooked or unhook yourself, you suffer from the Broken Status Effect until Second Wind deactivates. You are automatically healed 1 Health State after 28/24/20 seconds. While Second Wind is active, the following conditions will deactivate it: Successfully being healed by Second Wind. Being put into the Dying State before the timer elapses. Second Wind does not activate if you already suffer from the Broken Status Effect."
  },
  "self-care": {
    name: "Self-Care",
    role: "Survivor",
    character: "Claudette Morel",
    description: "Unlocks the Self-Care ability: Grants the ability to self-heal without needing a Med-Kit at 25/30/35 % of the regular Healing speed."
  },
  "self-preservation": {
    name: "Self-Preservation",
    role: "Survivor",
    character: "Yun-Jin Lee",
    description: "Whenever another Survivor is hooked, Self-Preservation triggers its effect: Grants the Elusive Status Effect for 20/25/30 seconds."
  },
  "shoulder the burden": {
    name: "Shoulder the Burden",
    role: "Survivor",
    character: "Taurie Cain",
    description: "Once per Trial, and while you are not on Death Hook, press the Active Ability button while standing in front of a Hooked Survivor to unhook them and trigger the following effects: Trade 1 Hook Stage with the other Survivor to their benefit. Causes you to scream and suffer from the Exposed Status Effect for 60/50/40 seconds."
  },
  "slippery meat": {
    name: "Slippery Meat",
    role: "Survivor",
    character: "All",
    description: "Grants the ability to attempt +3 additional Self-Unhooks during the first Hook Stage. Increases the chances to successfully perform a Self-Unhook by 2/3/4 %."
  },
  "small game": {
    name: "Small Game",
    role: "Survivor",
    character: "All",
    description: "Projects an invisible cone in the direction you are looking, with a Detection angle of 45 ° and a range of 8/10/12 metres: Triggers an audio cue when detecting any type of Totem within it. This effect has a cool-down of 14/12/10 seconds after use. Each time a Totem is cleansed, Small Game gains +1 Token, up to a maximum of 5 Tokens: Reduces the Detection angle of the cone by a stack-able -5 ° per Token, up to a maximum of -25 °."
  },
  "smash hit": {
    name: "Smash Hit",
    role: "Survivor",
    character: "Yun-Jin Lee",
    description: "Whenever you stun the Killer with a Pallet, Smash Hit triggers its effect: Grants a +50 % Haste Status Effect for 4 seconds. Smash Hit cannot be used while Exhausted. Smash Hit causes the Exhausted Status Effect for 30/25/20 seconds."
  },
  "sole survivor": {
    name: "Sole Survivor",
    role: "Survivor",
    character: "Laurie Strode",
    description: "Identical to Down to the Last."
  },
  "solidarity": {
    name: "Solidarity",
    role: "Survivor",
    character: "Jane Romero",
    description: "While injured, healing another Survivor without a Med-Kit causes Solidarity to apply the following effects: Grants the ability to passively heal yourself while healing other Survivors. Reduces your Personal Healing speed to 50/60/70 % of your Altruistic Healing speed."
  },
  "soul guard": {
    name: "Soul Guard",
    role: "Survivor",
    character: "Cheryl Mason",
    description: "Whenever you heal or recover from the Dying State, Soul Guard triggers its primary effect: Grants the Endurance Status Effect for 4/6/8 seconds. Endurance is cancelled prematurely when performing a Conspicuous Action of any kind. This ability has a cool-down of 30 seconds. While suffering from the Cursed Status Effect, Soul Guard applies its secondary effect: Unlocks the Self-Recovery ability, allowing you to fully recover from the Dying State."
  },
  "specialist": {
    name: "Specialist",
    role: "Survivor",
    character: "Lara Croft",
    description: "Whenever you unlock or rummage through a Chest, Specialist gains +1 Token, up to a maximum of 6 Tokens: Succeeding a Great Repair Skill Check while repairing a Generator consumes all Tokens. Permanently reduces the Repair Charges requirement of that Generator by 2/3/4 Charges per Token, up to a maximum of 12/18/24 Charges."
  },
  "spine chill": {
    name: "Spine Chill",
    role: "Survivor",
    character: "All",
    description: "Whenever the Killer is within 36 metres of your location and looking at you with a clear Line of Sight, Spine Chill activates: Warns of the Killer's proximity and their potential awareness of your location by lighting its icon. Increases your Action speeds for Blessing, Cleansing, Gate-Opening, Healing, Repairing, Sabotaging, Unhooking, and Unlocking by 2/4/6 %. This effect lingers for 0.5 seconds after the Killer loses Line of Sight or exits the Activation range."
  },
  "sprint burst": {
    name: "Sprint Burst",
    role: "Survivor",
    character: "Meg Thomas",
    description: "Starting to run triggers Sprint Burst: Grants a +50 % Haste Status Effect for 3 seconds. Sprint Burst cannot be used while Exhausted. Sprint Burst causes the Exhausted Status Effect for 60/50/40 seconds."
  },
  "stake out": {
    name: "Stake Out",
    role: "Survivor",
    character: "David Tapp",
    description: "Staying in the Terror Radius without being chased grants +1 Token every 15 seconds, up to a maximum of 2/3/4 Tokens. While performing a skilful interaction that can trigger Skill Checks, you benefit from the following effects: Converts any Good Skill Check into a Great Skill Check. This consumes -1 Token. Increases the Progression bonus of those Great Skill Checks by +1 %. Stake Out does not apply to regular Great Skill Checks nor do they consume any Tokens."
  },
  "still sight": {
    name: "Still Sight",
    role: "Survivor",
    character: "Aestri",
    description: "After standing still for 4/3/2 seconds, Still Sight activates: The following Auras are revealed to you within 24 meters: Killer, Chests, Generators. Still Sight deactivates once you start moving again."
  },
  "streetwise": {
    name: "Streetwise",
    role: "Survivor",
    character: "Nea Karlsson",
    description: "Any Items with Charges you retrieve from Chests benefit from the following primary effect: Increases their Charges permanently by 60/70/80 %. Whenever your currently equipped Item is depleted for the first time, Streetwise triggers its secondary effect: The Aura of the Killer is revealed to you for 8 seconds."
  },
  "strength in shadows": {
    name: "Strength in Shadows",
    role: "Survivor",
    character: "Sable Ward",
    description: "Whenever you are inside the Basement, Strength in Shadows activates: Unlocks the Strength in Shadows ability, allowing you to self-heal without needing a Med-Kit at 70 % of the normal Healing speed. Upon finishing a heal in the Basement, the Aura of the Killer is revealed to you for 6/8/10 seconds."
  },
  "teamwork: collective stealth": {
    name: "Teamwork: Collective Stealth",
    role: "Survivor",
    character: "Renato Lyra",
    description: "Whenever another Survivor finishes healing you, Teamwork: Collective Stealth activates, and both you and the Survivor who healed you benefit from the following effect: Suppresses your Scratch Marks for as long as you stay within 8/12/16 metres of one another. This effect lingers for 4 seconds once out of range and resumes upon re-entering it before that timer elapses. Survivors can only be affected by one instance of Teamwork: Collective Stealth at a time."
  },
  "teamwork: full circuit": {
    name: "Teamwork: Full Circuit",
    role: "Survivor",
    character: "Dustin Henderson",
    description: "For each Survivor repairing a generator with you, the size of the good Skill Check zone is increased by 15/20/25 %. While repairing with at least 1 other Survivor, you repair 5 % faster."
  },
  "teamwork: power of two": {
    name: "Teamwork: Power of Two",
    role: "Survivor",
    character: "Thalita Lyra",
    description: "Whenever you finish healing another Survivor, Teamwork: Power of Two activates, and both you and the healed Survivor benefit from the following effect: Grants a +5 % Haste Status Effect for as long as you stay within 8/12/16 metres of one another. This effect lingers for 4 seconds once out of range and resumes upon re-entering it before that timer elapses. Survivors can only be affected by one instance of Teamwork: Power of Two at a time."
  },
  "teamwork: soft-spoken": {
    name: "Teamwork: Soft-Spoken",
    role: "Survivor",
    character: "Eleven",
    description: "For each other Survivor repairing a Generator with you, the range at which the Generator's repair noise is heard is reduced by 15/20/25 %. While repairing with at least 1 other Survivor, you repair 5 % faster."
  },
  "teamwork: throw down": {
    name: "Teamwork: Throw Down",
    role: "Survivor",
    character: "Michonne Grimes",
    description: "Whenever you blind the Killer by any means or stun them using a Pallet, Teamwork: Throw Down triggers its effect: Grants the Endurance Status Effect to all other injured Survivors within 24 metres of your location for 6/8/10 seconds."
  },
  "teamwork: toughen up": {
    name: "Teamwork: Toughen Up",
    role: "Survivor",
    character: "Rick Grimes",
    description: "While injured, whenever another Survivor within 24 metres of your location blinds the Killer by any means or stuns them using a Pallet, Teamwork: Toughen Up triggers its effect: Suppresses your Grunts of Pain, and the creation of Pools of Blood and Scratch Marks for 20/25/30 seconds."
  },
  "technician": {
    name: "Technician",
    role: "Survivor",
    character: "Feng Min",
    description: "While repairing a Generator, the following effects apply: Reduces the audible range of all noises related to the Repair interaction by -8 metres. Increases the Progression penalty incurred when failing a Skill Check by 5/4/3 %. Suppresses the explosion of the Generator and the Loud Noise Notification usually triggered by that."
  },
  "tenacity": {
    name: "Tenacity",
    role: "Survivor",
    character: "David Tapp",
    description: "Your ferocious tenacity in dire situations allows you to benefit from the following effects while in the Dying State: Grants the ability to recover while crawling. Grants a 30/40/50 % Haste Status Effect. Reduces the volume of Grunts of Pain by -75 %. Blocks your Aura from being read."
  },
  "this is not happening": {
    name: "This Is Not Happening",
    role: "Survivor",
    character: "All",
    description: "Whenever you are in the Injured State, This Is Not Happening activates and you benefit from the following effect: Increases the Success zone for a Great Skill Check by 10/20/30 % for the following interactions: Healing, Repairing."
  },
  "troubleshooter": {
    name: "Troubleshooter",
    role: "Survivor",
    character: "Gabriel Soma",
    description: "When you are chased by the Killer, Troubleshooter activates: The Aura of the Generator with the most progress is revealed to you. The Aura of the Killer is revealed to you for 4/5/6 seconds after dropping a Pallet. These effects linger for 6/8/10 seconds after ending the Chase, after which Troubleshooter deactivates."
  },
  "unbreakable": {
    name: "Unbreakable",
    role: "Survivor",
    character: "Bill Overbeck",
    description: "Whenever you are put in the Dying State by the Killer, Unbreakable activates: Increases your Recovery speed by 25/30/35 %. Unlocks the Self-Recovery ability, allowing you to fully recover from the Dying State. This ability can only be used once per Trial."
  },
  "up the ante": {
    name: "Up the Ante",
    role: "Survivor",
    character: "Ace Visconti",
    description: "Unlocks the ability to attempt Self-Unhooks during the first Hook Stage for all Survivors. For every Survivor still in the Trial, Up the Ante is granted +1 Token: Increases the Luck at succeeding Self-Unhook attempts for all Survivors by a stack-able 1/2/3 % per Token, up to a maximum of 3/6/9 %."
  },
  "urban evasion": {
    name: "Urban Evasion",
    role: "Survivor",
    character: "Nea Karlsson",
    description: "You benefit from the following permanent effect: Increases your Movement speed while crouched by 90/95/100 %."
  },
  "vigil": {
    name: "Vigil",
    role: "Survivor",
    character: "Quentin Smith",
    description: "You recover 43/55/66 % faster from the following: The Blindness, Broken, Exhausted, Exposed, Haemorrhage, Hindered, Mangled, and Oblivious Status Effects. Vigil extends its effect to all Survivors within 16 metres of your location and lingers for 15 seconds after leaving its Area of Effect. Survivors can only be affected by one instance of Vigil at a time."
  },
  "visionary": {
    name: "Visionary",
    role: "Survivor",
    character: "Felix Richter",
    description: "You benefit from the following permanent effect: The Auras of Generators are revealed to you within 32 metres. Visionary is temporarily deactivated for 20/18/16 seconds whenever a Generator is completed."
  },
  "wake up!": {
    name: "Wake Up!",
    role: "Survivor",
    character: "Quentin Smith",
    description: "Unlocks potential in your Aura-reading ability. Once all Generators are completed, Wake Up! activates: The Auras of the Exit Gate Switches are revealed to you permanently while within 128 metres. Your Aura is revealed to all other Survivors within 128 metres while you are opening an Exit Gate. Increases your Gate-Opening speed by a stack-able 8/10/12.5 % for each Survivor still alive in the Trial, including yourself, up to a maximum of 32/40/50 %."
  },
  "we see you": {
    name: "We See You",
    role: "Survivor",
    character: "Eleven",
    description: "Gain 1 token when the Killer reveals your Aura. When you have 4 tokens, they are all consumed, and the Killer's aura is revealed to you and all other Survivors for 10/12.5/15 seconds. This perk has a 10-second cooldown for gaining tokens."
  },
  "we'll make it": {
    name: "We'll Make It",
    role: "Survivor",
    character: "All",
    description: "After unhooking another Survivor, We'll Make It activates for 30/60/90 seconds: Increases your Altruistic Healing speed by +100 %."
  },
  "we're gonna live forever": {
    name: "We're Gonna Live Forever",
    role: "Survivor",
    character: "David King",
    description: "You benefit from the following effect when healing a dying Survivor: Increases your Healing speed by +100 %. Any dying Survivor you heal back to the Injured State benefits from the following effect: Grants the Endurance Status Effect for 6/8/10 seconds. This effect can only be triggered once every 30 seconds."
  },
  "wicked": {
    name: "Wicked",
    role: "Survivor",
    character: "Sable Ward",
    description: "After you are unhooked by any means, Wicked triggers the following effect: The Aura of the Killer is revealed to you for 16/18/20 seconds. While hooked inside the Basement, Wicked potentially triggers the following effect: First Hook Stage: 100 % to succeed an attempted Self-Unhook. Second Hook Stage: Does not trigger the effect. Last Survivor Standing: Does not trigger the effect."
  },
  "wide open throttle": {
    name: "Wide Open Throttle",
    role: "Survivor",
    character: "Shane Wiigwaas",
    description: "Fast-vaulting a Pallet triggers the following effects: Gain 10/12.5/15 % Haste Status Effect for 3 seconds. The Pallet is immediately reset and blocked by the Entity for 60 seconds. This perk then goes on a 60 second cool-down."
  },
  "will to live": {
    name: "Will to Live",
    role: "Survivor",
    character: "All",
    description: "After being unhooked or unhooking yourself, Will to Live activates for the next 40/50/60 seconds: When grabbed or picked up by the Killer, succeed a Skill Check to stab the Killer and escape from their grasp. Stuns the Killer for 4 seconds. Causes you to become the next Obsession. Will to Live is deactivated once the Exit Gates are powered. Will to Live is disabled for the remainder of the Trial after use. Will to Live is deactivated prematurely when performing a Conspicuous Action. Increases your chance of becoming the initial Obsession by increasing the default value by +100 %."
  },
  "windows of opportunity": {
    name: "Windows of Opportunity",
    role: "Survivor",
    character: "Kate Denson",
    description: "Unlocks potential in your Aura-reading ability. The Auras of Breakable Walls, Pallets, and Windows are revealed to you within 24/28/32 metres."
  },
  "wiretap": {
    name: "Wiretap",
    role: "Survivor",
    character: "Ada Wong",
    description: "After repairing a Generator for the equivalent of 40 % of Progression, Wiretap activates. While active, press the Active Ability button while standing next to a Generator to install a listening device to it with a countdown of 100/110/120 seconds: Reveals the Aura of the Killer coming within 14 metres of the Bugged Generator to all Survivors. The listening device is deactivated after its countdown has elapsed or the Bugged Generator is damaged. The Auras of Bugged Generators are revealed to all Survivors in yellow."
  },
  "a nurse's calling": {
    name: "A Nurse's Calling",
    role: "Killer",
    character: "The Nurse",
    description: "Unlocks potential in your Aura-reading ability: The Auras of injured Survivors being healed or healing themselves are revealed to you within 28/30/32 metres."
  },
  "agitation": {
    name: "Agitation",
    role: "Killer",
    character: "The Trapper",
    description: "While carrying a Survivor, Agitation activates: Increases your Carrying speed by 6/12/18 %. Increases your Terror Radius by +12 metres."
  },
  "alien instinct": {
    name: "Alien Instinct",
    role: "Killer",
    character: "The Xenomorph",
    description: "Whenever you hook a Survivor, Alien Instinct activates: The Aura of the farthest Survivor from your current location who is in the Injured State is revealed to you for 8 seconds. Causes that Survivor to suffer from the Oblivious Status Effect for 40/50/60 seconds."
  },
  "all-shaking thunder": {
    name: "All-Shaking Thunder",
    role: "Killer",
    character: "The Houndmaster",
    description: "After falling from a height, All-Shaking Thunder activates for 15/20/25 seconds: Increases the range of your Lunge Attack by +75 %. All-Shaking Thunder has a cool-down of 5 seconds."
  },
  "awakened awareness": {
    name: "Awakened Awareness",
    role: "Killer",
    character: "The Mastermind",
    description: "While carrying a Survivor, you benefit from the following effect: The Auras of other Survivors within 16/18/20 metres of your location are revealed to you."
  },
  "bamboozle": {
    name: "Bamboozle",
    role: "Killer",
    character: "The Clown",
    description: "You benefit from the following permanent effect: Increases your Vaulting speed by 5/10/15 %. Whenever you vault a Window, Bamboozle calls upon The Entity for the following effect: Blocks it to all Survivors for 8/12/16 seconds. Vaulting it again within that time resets the timer. Vaulting a different one transfers the effect to it instead. Bamboozle does not extend its effects to vaulting a dropped Pallet."
  },
  "barbecue & chilli": {
    name: "Barbecue & Chilli",
    role: "Killer",
    character: "The Cannibal",
    description: "After hooking a Survivor, all Survivors who are at least 60/50/40 metres away from that Hook have their Aura revealed to you for 5 seconds."
  },
  "batteries included": {
    name: "Batteries Included",
    role: "Killer",
    character: "The Good Guy",
    description: "While within 16 metres of a completed Generator, you benefit from the following effect: Grants a +5 % Haste Status Effect. This effect lingers for 1/3/5 second(s)."
  },
  "beast of prey": {
    name: "Beast of Prey",
    role: "Killer",
    character: "The Huntress",
    description: "Whenever you trigger the Bloodlust Status Effect, Beast of Prey activates for 30/35/40 seconds: Grants the Undetectable Status Effect."
  },
  "bitter murmur": {
    name: "Bitter Murmur",
    role: "Killer",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability. Whenever a Generator is completed, Bitter Murmur triggers its primary effect: The Auras of any Survivors within 16 metres of that Generator are revealed to you for 5 seconds. Once the last Generator is completed, Bitter Murmur triggers its secondary effect: The Auras of all Survivors are revealed to you for 5/7/10 seconds."
  },
  "blood echo": {
    name: "Blood Echo",
    role: "Killer",
    character: "The Oni",
    description: "Whenever you hook a Survivor, Blood Echo triggers its effect: Causes all Survivors in the Injured State to suffer from the Exhausted and Haemorrhage Status Effects for 20/25/30 seconds."
  },
  "blood warden": {
    name: "Blood Warden",
    role: "Killer",
    character: "The Nightmare",
    description: "As soon as at least one Exit Gate is opened, Blood Warden activates: The Auras of Survivors are revealed to you, whenever they are inside the Exit Gate. Once per Trial, hooking a Survivor while Blood Warden is active calls upon The Entity to trigger the following effect: Blocks all opened Exit Gates for 40/50/60 seconds, preventing any remaining Survivor from leaving the Trial through them."
  },
  "bloodhound": {
    name: "Bloodhound",
    role: "Killer",
    character: "The Wraith",
    description: "Bloodhound causes the following effects: Pools of Blood left by injured Survivors appear in bright red. Extends their lifetime by 2/3/4 seconds."
  },
  "brutal strength": {
    name: "Brutal Strength",
    role: "Killer",
    character: "The Trapper",
    description: "While performing the Break or Damage action on Breakable Walls, Pallets, or Generators, Brutal Strength triggers its effect: Increases the Action speed by 10/15/20 %."
  },
  "call of brine": {
    name: "Call of Brine",
    role: "Killer",
    character: "The Onryō",
    description: "After performing the Damage Generator action on a Generator, Call of Brine applies its effects to it for 70 seconds: Increases its Regression speed to 130/140/150 % of the default value. Highlights its Aura to you in yellow. Triggers a Loud Noise Notification whenever a Survivor succeeds a Good Skill Check while repairing it."
  },
  "corrupt intervention": {
    name: "Corrupt Intervention",
    role: "Killer",
    character: "The Plague",
    description: "At the start of the Trial, the 3 Generators located farthest from you are blocked by The Entity for 80/100/120 seconds. Corrupt Intervention deactivates prematurely once the first Survivor is put into the Dying State."
  },
  "coulrophobia": {
    name: "Coulrophobia",
    role: "Killer",
    character: "The Clown",
    description: "Survivors inside your Terror Radius suffer from the following effects: Reduces all Healing speeds by 30/40/50 %. Increases the Pointer-Rotation speed of Healing Skill Checks by +50 %."
  },
  "coup de grâce": {
    name: "Coup de Grâce",
    role: "Killer",
    character: "The Twins",
    description: "Whenever a Generator is completed, Coup de Grâce gains +2 Tokens, up to a maximum of 10 Tokens per Trial: Increases the range of your next Lunge Attack by 70/75/80 %, while consuming -1 Token. Coup de Grâce can only hold a maximum of 5 Tokens at a time."
  },
  "cruel limits": {
    name: "Cruel Limits",
    role: "Killer",
    character: "The Demogorgon",
    description: "Whenever a Generator is completed, Cruel Limits triggers its effect for 20/25/30 seconds: Blocks all Windows for all Survivors. The Auras of the Blocked Windows are revealed to you and highlighted in yellow."
  },
  "cull the weak": {
    name: "Cull the Weak",
    role: "Killer",
    character: "All",
    description: "Each time you hook a Survivor other than your Obsession, you gain +1 Token: For as long as the Obsession is alive, all other Survivors suffer from a stack-able 2/2.5/3 % per Token Action Speed penalty to Repairing, Healing, and Sabotaging, up to a maximum of 22/27.5/33 % or 11 Tokens. The Obsession is unaffected by this penalty and instead granted a permanent +33 % Action Speed bonus to Unhooking and Healing other Survivors."
  },
  "dark arrogance": {
    name: "Dark Arrogance",
    role: "Killer",
    character: "The Lich",
    description: "Whenever you are vaulting a Window, you benefit from the following effect: Increases the Vaulting speed by 15/20/25 %. Whenever you are stunned with a Pallet or blinded by any means, you suffer from the following effects: Reduces the Recovery speed from Pallet Stuns by -15 %. Increases the duration of Killer Blinds by +15 %."
  },
  "dark devotion": {
    name: "Dark Devotion",
    role: "Killer",
    character: "The Plague",
    description: "Whenever the Obsession becomes injured by any means, Dark Devotion activates for 35/40/45 seconds: Transfers your Terror Radius to the Obsession. This Terror Radius is set to 40 metres. Grants the Undetectable Status Effect."
  },
  "darkness revealed": {
    name: "Darkness Revealed",
    role: "Killer",
    character: "The Dredge",
    description: "Searching a Locker has the following effect: The Auras of Survivors within 8 metres of any Locker are revealed to you for 6/7/8 seconds. Darkness Revealed has a cool-down of 30 seconds."
  },
  "dead man's switch": {
    name: "Dead Man's Switch",
    role: "Killer",
    character: "The Deathslinger",
    description: "After hooking a Survivor, Dead Man's Switch triggers its effect: Blocks the first Generator any Survivor stops repairing for 25/30/35 seconds. The Blocked Generator is highlighted to you in white. Dead Man's Switch cannot activate if its effect is still active from a previous activation."
  },
  "deadlock": {
    name: "Deadlock",
    role: "Killer",
    character: "The Cenobite",
    description: "Identical to No Holds Barred."
  },
  "deathbound": {
    name: "Deathbound",
    role: "Killer",
    character: "The Executioner",
    description: "Whenever a Survivor finishes healing another Survivor for the equivalent of 1 Health State, Deathbound activates: Causes the Healer to scream and reveal their location. Causes the Healer to suffer from the Oblivious Status Effect whenever they are farther than 12/8/4 metres from the other Survivor. The Healer sees the Aura of the Healed Survivor while Deathbound is active. Deathbound deactivates after the Healer loses a Health State."
  },
  "deerstalker": {
    name: "Deerstalker",
    role: "Killer",
    character: "All",
    description: "Unlocks potential in your Aura-reading ability. Whenever a Survivor reads your Aura, Deerstalker activates for the same duration as their Aura-reading action: The Aura of that Survivor is revealed to you. Furthermore, the following effect triggers automatically every 40/35/30 seconds: Your Aura is revealed for 3 seconds to the Survivor with currently the lowest cumulative Chase time."
  },
  "discordance": {
    name: "Discordance",
    role: "Killer",
    character: "The Legion",
    description: "Any Generator within a range of 64/96/128 metres that is being repaired by 2 or more Survivors is marked by a yellow Aura. When the Generator is first highlighted, Discordance triggers a Loud Noise Notification on the Generator. After the Generator is no longer within range or is being repaired by just 1 Survivor, the highlighted Aura will linger for another 4 seconds."
  },
  "dissolution": {
    name: "Dissolution",
    role: "Killer",
    character: "The Dredge",
    description: "After 3 seconds of injuring a Survivor by any means, Dissolution activates for 12/16/20 seconds: Instantly breaks the next Pallet that Survivor performs a Fast Vault across while inside your Terror Radius."
  },
  "distressing": {
    name: "Distressing",
    role: "Killer",
    character: "All",
    description: "You benefit from the following permanent effect: Increases your Terror Radius by 20/25/30 %."
  },
  "dominance": {
    name: "Dominance",
    role: "Killer",
    character: "The Dark Lord",
    description: "The first time each Chest and each Totem are interacted with by a Survivor, Dominance triggers its effect: Calls upon The Entity to block it for 8/12/16 seconds. The Aura of the blocked Prop is revealed to you in white."
  },
  "dragon's grip": {
    name: "Dragon's Grip",
    role: "Killer",
    character: "The Blight",
    description: "After performing the Damage Generator action on a Generator, Dragon's Grip activates for 30 seconds. While active, the first Survivor interacting with that Generator suffers from the following effects: Causes them to scream and reveal their location for 4 seconds. Inflicts the Exposed Status Effect for 60 seconds. Dragon's Grip has a cool-down of 60/45/30 seconds."
  },
  "dying light": {
    name: "Dying Light",
    role: "Killer",
    character: "The Shape",
    description: "Identical to Cull the Weak."
  },
  "enduring": {
    name: "Enduring",
    role: "Killer",
    character: "The Hillbilly",
    description: "You benefit from the following effect: Reduces the duration of Pallet Stuns by 40/45/50 %. This effect does not apply when stunned while carrying a Survivor."
  },
  "eruption": {
    name: "Eruption",
    role: "Killer",
    character: "The Nemesis",
    description: "Performing the Damage Generator action on Generators highlights their Auras in yellow. Whenever a Survivor enters the Dying State by any means, Eruption triggers the following effects on all highlighted Generators: Causes them to explode, damaging them. Instantly regresses them by -10 % of their total Progression. Causes them to start regressing afterwards. Causes all Survivors currently repairing them to suffer from the following effects: Causes them to scream. Their Auras are revealed to you for 8/10/12 seconds. Eruption has a cool-down of 30 seconds after triggering its effects, which also resets the highlighted Auras."
  },
  "fire up": {
    name: "Fire Up",
    role: "Killer",
    character: "The Nightmare",
    description: "For each completed Generator, Fire Up gains +1 Token, up to a maximum of 5 Tokens: Increases the Action speeds for the following interactions by a stack-able 4/5/6 % per Token, up to a maximum of 20/25/30 %: Picking up and dropping Survivors. Breaking Breakable Walls and dropped Pallets. Damaging Generators. Vaulting Windows."
  },
  "forced hesitation": {
    name: "Forced Hesitation",
    role: "Killer",
    character: "The Singularity",
    description: "Whenever a Survivor is put into the Dying State by any means, Forced Hesitation triggers its effect: Causes all other Survivors within 16 metres of them suffer from a -20 % Hindered Status Effect for 10 seconds. Forced Hesitation has a cool-down of 40/35/30 seconds."
  },
  "forced penance": {
    name: "Forced Penance",
    role: "Killer",
    character: "The Executioner",
    description: "Whenever a Survivor triggers a Protection Hit, they suffer from the following effect: Inflicts the Broken Status Effect for 60/70/80 seconds."
  },
  "forever entwined": {
    name: "Forever Entwined",
    role: "Killer",
    character: "The Ghoul",
    description: "Whenever a Survivor takes damage, Forever Entwined gains +1 Token, up to a maximum of 6/7/8 Tokens: Increases the Action speeds for Dropping, Hooking, and Picking up a Survivor by a stack-able +4 % per Token, up to a maximum of 24/28/32 %."
  },
  "franklin's demise": {
    name: "Franklin's Demise",
    role: "Killer",
    character: "The Cannibal",
    description: "Survivors hit with your vicious Basic Attack drop any equipped Item on impact: The Auras of lost Items are revealed to you within 32/48/64 metres."
  },
  "friends 'til the end": {
    name: "Friends 'til the End",
    role: "Killer",
    character: "The Good Guy",
    description: "When you hook any Survivor that is not the Obsession, the following effects apply to the Obsession: Their Aura is revealed for 6/8/10 seconds. They suffer from the Exposed Status Effect for 20 seconds. When you hook the Obsession, the following effects apply to a random Survivor: Causes the Survivor to scream and reveal their location to the Killer. They become the new Obsession."
  },
  "furtive chase": {
    name: "Furtive Chase",
    role: "Killer",
    character: "The Ghost Face",
    description: "After hooking the Obsession, you benefit from the following effects for 14/16/18 seconds: Grants the Undetectable Status Effect. Grants a +10 % Haste Status Effect. Whenever the Obsession is unhooked by another Survivor, the Obsession Status transfers to their Rescuer."
  },
  "game afoot": {
    name: "Game Afoot",
    role: "Killer",
    character: "The Skull Merchant",
    description: "Whenever you hit the Survivor with currently the highest cumulative Chase time with a Basic Attack, Game Afoot triggers its primary effect: Causes the Obsession Status to transfer to that Survivor. While chasing the Obsession, performing the Break or Damage action causes Game Afoot to trigger its secondary effect: Grants a +7 % Haste Status Effect for 8/9/10 seconds."
  },
  "gearhead": {
    name: "Gearhead",
    role: "Killer",
    character: "The Deathslinger",
    description: "After a Survivor loses a Health State, Gearhead activates for 30 seconds: While Gearhead is active, a Survivor succeeding a Good Skill Check while repairing reveals their Aura to you for 6/7/8 seconds."
  },
  "genetic limits": {
    name: "Genetic Limits",
    role: "Killer",
    character: "The Singularity",
    description: "Whenever a Survivor loses a Health State by any means, Genetic Limits triggers its effect: Causes them to suffer from the Exhausted Status Effect for 6/7/8 seconds."
  },
  "grim embrace": {
    name: "Grim Embrace",
    role: "Killer",
    character: "The Artist",
    description: "Each time a Survivor is hooked for the first time, Grim Embrace gains +1 Token and activates once you are at least 16 metres away from the Hook: 1-3 Tokens: Blocks all Generators for 6/8/10 seconds. 4 Tokens: Blocks all Generators for 40 seconds and the Aura of the Obsession is revealed to you for 6 seconds."
  },
  "haywire": {
    name: "Haywire",
    role: "Killer",
    character: "The Animatronic",
    description: "Whenever a Survivor stops opening an Exit Gate after accumulating at least 80 % Progression towards being opened, Haywire causes it to regress: Regresses at a rate of 80/90/100 % of the normal Gate-Opening speed. Causes Survivors to see the lights atop the switch flickering randomly while it regresses."
  },
  "help wanted": {
    name: "Help Wanted",
    role: "Killer",
    character: "The Animatronic",
    description: "After performing the Damage Generator action, Help Wanted activates: Causes that Generator to become a Compromised Generator. Once the Compromised Generator is completed, you benefit from the following effect for 40/50/60 seconds: Increases the Recovery speed of successful Basic Attacks by +25 %."
  },
  "hex: blood favour": {
    name: "Hex: Blood Favour",
    role: "Killer",
    character: "The Blight",
    description: "Hex: Blood Favour lights a Hex Totem at the start of the Trial, cursing Survivors with its Hex Effects. Whenever a Survivor loses a Health State by any means, Hex: Blood Favour triggers its effect for 15 seconds: Blocks all upright Pallets within 24/28/32 metres of that Survivor. Blocked Pallets cannot be dropped by any Survivor. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: crowd control": {
    name: "Hex: Crowd Control",
    role: "Killer",
    character: "The Trickster",
    description: "Whenever a Survivor performs a Rushed Vault action at a Window, Hex: Crowd Control activates on a random Totem and triggers its effect: Blocks that Window for all Survivors. Increases basic-vault speed of blocked Windows by 15 %. Reveals auras of blocked Windows within 24 metres. Hex: Crowd Control has a limit of 4/5/6 Windows it can affect at a time. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: devour hope": {
    name: "Hex: Devour Hope",
    role: "Killer",
    character: "The Hag",
    description: "Hex: Devour Hope lights a Hex Totem at the start of the Trial, cursing Survivors with its Hex Effects. Whenever a Survivor is unhooked at least 24 metres from your location, Hex: Devour Hope gains +1 Token, up to a maximum of 5 Tokens: At 2 Tokens: 10 seconds after hooking a Survivor, you are granted a 3/4/5 % Haste Status Effect for 10 seconds. At 3 Tokens: Afflicts all Survivors with the Exposed Status Effect. At 5 Tokens: Unlocks the Kill ability, allowing you to kill dying Survivors by your own hands. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: face the darkness": {
    name: "Hex: Face the Darkness",
    role: "Killer",
    character: "The Knight",
    description: "If there is still a Dull Totem in the environment, Hex: Face the Darkness lights a Hex Totem after injuring a Survivor by any means, cursing them with its Hex Effects. While cursed, the following effects trigger once every 35/30/25 seconds on all other Survivors outside of the Terror Radius: Causes them to scream. Their Auras are revealed to you for 2 seconds. Hex: Face the Darkness is deactivated once the Cursed Survivor either returns to Healthy or enters the Dying State by any means, extinguishing the Hex Totem. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: fortune's fool": {
    name: "Hex: Fortune's Fool",
    role: "Killer",
    character: "All",
    description: "If there is still a Dull Totem in the environment, Hex: Fortune's Fool lights a Hex Totem whenever you hook a Survivor for the first time, cursing them with its Hex Effects. Inflicts the Oblivious Status Effect. Blocks the Hex Totem for all other Survivors for 90 seconds. Blocked Hex Totems cannot be cleansed or blessed by Survivors. This does not affect the Cursed Survivor. The Aura of the Hex Totem is revealed to the Cursed Survivor within 24/20/16 metres. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: haunted ground": {
    name: "Hex: Haunted Ground",
    role: "Killer",
    character: "The Spirit",
    description: "Hex: Haunted Ground lights 2 Hex Totems at the start of the Trial, laying a trap for Survivors. Blessing or cleansing either Hex Totem trips the trap and triggers the following effect: Causes all Survivors to suffer from the Exposed Status Effect for 40/50/60 seconds. Hex: Haunted Ground extinguishes the second Hex Totem after tripping its trap. Hex: Haunted Ground is disabled for the remainder of the Trial after triggering its effect."
  },
  "hex: hive mind": {
    name: "Hex: Hive Mind",
    role: "Killer",
    character: "The First",
    description: "The first time you hook any Survivor, a random Dull Totem becomes a Hex Totem, provided that a Dull Totem remains in the Trial Grounds. Generators are highlighted; the intensity of the generator's Auras reveals their repair progress. As soon as a total of 4 generators have been completed in the Trial: All remaining generators explode, lose 6/8/10 % progress, and start regressing. The associated Hex Totem becomes dull, and this perk becomes disabled for the remainder of the trial. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: huntress lullaby": {
    name: "Hex: Huntress Lullaby",
    role: "Killer",
    character: "The Huntress",
    description: "Survivors performing Healing or Repairing actions suffer from the following effect: Increases the Progression penalty for Failed Skill Checks by 2/4/6 %. Each time a Survivor is hooked, Hex: Huntress Lullaby grows in power and gains +1 Token, up to a maximum of 5 Tokens. Survivors performing Healing or Repairing actions suffer from the following additional effect: Reduces the time between the audio cue announcing an imminent Skill Check and it appearing, depending on the number of accumulated Tokens: 1 Token: -14 %. 2 Tokens: -28 %. 3 Tokens: -42 %. 4 Tokens: -56 %. 5 Tokens: Suppresses the audio cue altogether. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: no one escapes death": {
    name: "Hex: No One Escapes Death",
    role: "Killer",
    character: "All",
    description: "Once the Exit Gates are powered, if there is still a Dull Totem remaining in the environment, Hex: No One Escapes Death activates and lights it: Grants a 2/3/4 % Haste Status Effect. Causes all Survivors to suffer from the Exposed Status Effect. Once the Status Effect is revealed to Survivors, Hex: No One Escapes Death triggers the following effect: The Aura of its Hex Totem is revealed to all Survivors within 4 metres. This range gradually expands to 24 metres over the course of 30 seconds. Hex: No One Escapes Death remains inactive if no Dull Totems are available. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: nothing but misery": {
    name: "Hex: Nothing but Misery",
    role: "Killer",
    character: "The Ghoul",
    description: "After damaging Survivors a total of 8 times with Basic Attacks, a random Dull Totem becomes a Hex Totem, cursing all Survivors: Survivors damaged by a Basic Attack suffer from a -5 % Hindered Status Effect for 10/12.5/15 seconds. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: overture of doom": {
    name: "Hex: Overture of Doom",
    role: "Killer",
    character: "The Krasue",
    description: "Creates a Hex Totem that curses the farthest Generator from its location: The Aura of the Cursed Generator is highlighted in yellow. When a Survivor repairs the Cursed Generator for at least 5 seconds, Hex: Overture of Doom triggers the following effects for 20/25/30 seconds: Transfers your Terror Radius to the Cursed Generator. This Terror Radius is set to 32 metres. Grants the Undetectable Status Effect. Once the Cursed Generator is repaired, the next farthest Generator becomes cursed. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: pentimento": {
    name: "Hex: Pentimento",
    role: "Killer",
    character: "The Artist",
    description: "Unlocks potential in your Aura-reading ability: The Auras of cleansed Totems are revealed to you in white. Press the Interaction button over the remains of a cleansed Totem to resurrect it as a Rekindled Totem. For each Rekindled Totem, Hex: Pentimento gains +1 Token, up to a maximum of 5 Tokens: 1 Token: Reduces the Action speeds for Healing and Repairing by -20 %. 2 to 5 Tokens: Increase the strength of the Action Speed penalty by a stackable 1/2/3 % per Token, up to a maximum of 24/28/32 %. Survivors cursed by Hex: Pentimento see the Auras of Rekindled Totems within 16 metres. Once Hex: Pentimento has reached its limit of 5 Tokens, it calls upon The Entity for the following effect: Blocks all Rekindled Totems for the remainder of the Trial. Totems may only be rekindled once per Trial, with The Entity consuming the remains of Rekindled Totems once they are cleansed. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: plaything": {
    name: "Hex: Plaything",
    role: "Killer",
    character: "The Cenobite",
    description: "Identical to Hex: Fortune's Fool."
  },
  "hex: retribution": {
    name: "Hex: Retribution",
    role: "Killer",
    character: "The Deathslinger",
    description: "Whenever a Survivor blesses or cleanses a Totem, Hex: Retribution triggers its primary effect: Causes that Survivor to suffer from the Oblivious Status Effect for 40/50/60 seconds. Whenever a Hex Totem is removed by any means, including its own, Hex: Retribution triggers its secondary effect: The Auras of all Survivors are revealed to you for 20 seconds. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: ruin": {
    name: "Hex: Ruin",
    role: "Killer",
    character: "The Hag",
    description: "All Generators not currently being repaired experience the following effect: Causes them to automatically regress at 100/125/150 % of the default Regression rate. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: scared to death": {
    name: "Hex: Scared to Death",
    role: "Killer",
    character: "The Slasher",
    description: "When you Hook 3 different Survivors, Hex: Scared to Death activates on a random Totem and triggers its effect: Basic-breaking a Pallet during a chase causes all Survivors within 13 metres to scream and gain 11/12/13 % Hindered Status Effect for 3 seconds. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: the third seal": {
    name: "Hex: The Third Seal",
    role: "Killer",
    character: "The Hag",
    description: "The last 2/3/4 Survivors you hit with a Basic or Special Attack suffer permanently from the Blindness Status Effect. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: thrill of the hunt": {
    name: "Hex: Thrill of the Hunt",
    role: "Killer",
    character: "All",
    description: "Start the Trial with 5 Tokens, one for each Totem located in the environment: Reduces the Action speeds for Blessing and Cleansing by a stack-able 8/10/12 % per Token, up to a maximum of 40/50/60 %. Hex: Thrill of the Hunt loses -1 Token whenever a Totem is cleansed. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: two can play": {
    name: "Hex: Two Can Play",
    role: "Killer",
    character: "The Good Guy",
    description: "Anytime you are stunned or blinded by any Survivor a total of 4/3/2 times, and if there is not yet a Hex Totem already associated with Hex: Two Can Play and there is at least one Dull Totem remaining in the Trial Grounds, Hex: Two Can Play activates on a random Totem: Blinds all Survivors who stun or blind you for 1.5 seconds. This does not affect carried Survivors. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: undying": {
    name: "Hex: Undying",
    role: "Killer",
    character: "The Blight",
    description: "Whenever a Survivor is within 2/3/4 metres of a Dull Totem, Hex: Undying triggers its primary effect: Their Aura is revealed to you for as long as they remain in that range. Whenever a Hex Totem is cleansed, Hex: Undying triggers its secondary effect: Transfers the cleansed Hex to the Hex Totem associated with Hex: Undying instead, replacing it. The Hex Effects persist until the Hex Totem is either blessed or cleansed by a Survivor, disabling it for the remainder of the Trial."
  },
  "hex: wretched fate": {
    name: "Hex: Wretched Fate",
    role: "Killer",
    character: "The Dark Lord",
    description: "After a Generator is completed, Hex: Wretched Fate activates and lights a random Dull Totem, cursing the Obsession: Reduces their Repair speed by 27/30/33 %. The Aura of the Hex Totem is revealed to them within 12 metres."
  },
  "hoarder": {
    name: "Hoarder",
    role: "Killer",
    character: "The Twins",
    description: "Hoarder triggers a Loud Noise Notification for 4 seconds, whenever a Survivor performs any of the following actions within 32/48/64 metres of your location: Unlocks a Chest. Picks up any Item. Hoarder spawns 2 additional Chests in the Trial."
  },
  "hubris": {
    name: "Hubris",
    role: "Killer",
    character: "The Knight",
    description: "Whenever a Survivor stuns you by any means, Hubris triggers its effect: Causes them to suffer from the Exposed Status Effect for 20/25/30 seconds. Hubris has a cool-down of 20 seconds."
  },
  "human greed": {
    name: "Human Greed",
    role: "Killer",
    character: "The Dark Lord",
    description: "Grants the ability to kick opened Chests and close them. The Auras of unopened Chests are revealed to you at all times. The Auras of Survivors coming within 8 metres of unopened or closed Chests are revealed to you for 3/4/5 seconds. Human Greed has a cool-down of 10 seconds on the ability to kick Chests."
  },
  "hysteria": {
    name: "Hysteria",
    role: "Killer",
    character: "The Nemesis",
    description: "Whenever you injure a healthy Survivor, Hysteria triggers its effect: Causes all Survivors currently in the Injured State to suffer from the Oblivious Status Effect for 30/35/40 seconds. This effect also applies to the Survivor triggering it. Hysteria has a cool-down of 20 seconds."
  },
  "i'm all ears": {
    name: "I'm All Ears",
    role: "Killer",
    character: "The Ghost Face",
    description: "Whenever a Survivor performs a Rushed Vault action within 48 metres of your location, you benefit from the following effect: The Aura of the Survivor is revealed to you for 8 seconds. I'm All Ears has a cool-down of 60/45/30 seconds."
  },
  "infectious fright": {
    name: "Infectious Fright",
    role: "Killer",
    character: "The Plague",
    description: "Whenever a Survivor is put into the Dying State by any means, all other Survivors within your Terror Radius will scream and reveal their current location to you for 4/5/6 seconds."
  },
  "insidious": {
    name: "Insidious",
    role: "Killer",
    character: "All",
    description: "After standing still for 3/2/1 second(s), Insidious activates for as long as you remain stationary: Grants the Undetectable Status Effect. Insidious deactivates once you start moving again."
  },
  "iron grasp": {
    name: "Iron Grasp",
    role: "Killer",
    character: "All",
    description: "While carrying a Survivor, they suffer from the following effects: Reduces the strength of the Involuntary Strafing caused by their wiggling by -75 %. Increases the time required to break free from your grasp by 4/8/12 %."
  },
  "iron maiden": {
    name: "Iron Maiden",
    role: "Killer",
    character: "The Legion",
    description: "While interacting with an empty Locker, Iron Maiden applies its primary effect: Increases your Search speed by 30/40/50 %. Whenever a Survivor exits a Locker, Iron Maiden triggers its secondary effects: Causes them to scream and trigger a Loud Noise Notification at their current location. This effect lingers for 4 seconds. Causes them to suffer from the Exposed Status Effect for 30 seconds."
  },
  "keep them waiting": {
    name: "Keep Them Waiting",
    role: "Killer",
    character: "All",
    description: "Damaging any Survivor other than the Obsession with a Basic Attack causes Keep Them Waiting to gain +1 Token, up to a maximum of 6/7/8 Tokens. Damaging the Obsession with either a Basic Attack or Special Attack causes Keep Them Waiting to lose -2 Tokens: Grants a stack-able -4 % per Token Cool-down time reduction on successful Basic Attacks, up to a maximum of 24/28/32 %. Keep Them Waiting freezes its current Token Count once the Obsession is sacrificed or killed."
  },
  "knock out": {
    name: "Knock Out",
    role: "Killer",
    character: "The Cannibal",
    description: "Whenever a Survivor moves farther than 6 metres from a Pallet within 6 seconds of dropping it, Knock Out triggers its effect: Causes them to suffer from a -5 % Hindered Status Effect for 3/4/5 seconds."
  },
  "languid touch": {
    name: "Languid Touch",
    role: "Killer",
    character: "The Lich",
    description: "When a Survivor scares off a Crow within 36 metres of your location, Languid Touch activates: Causes that Survivor to suffer from the Exhausted Status Effect for 6/8/10 seconds. Languid Touch has a cool-down of 5 seconds."
  },
  "lethal pursuer": {
    name: "Lethal Pursuer",
    role: "Killer",
    character: "The Nemesis",
    description: "At the start of the Trial, the Auras of all Survivors are revealed to you for 7/8/9 seconds. Extends the duration of all instances of a Survivor Aura being revealed to you by +2 seconds. Lethal Pursuer benefits from its own effect."
  },
  "leverage": {
    name: "Leverage",
    role: "Killer",
    character: "The Skull Merchant",
    description: "Whenever a Survivor performs an Unhook action, they suffer from the following effect for 60 seconds: Reduces their Healing speeds by 20/25/30 %."
  },
  "lightborn": {
    name: "Lightborn",
    role: "Killer",
    character: "The Hillbilly",
    description: "The Auras of Survivors attempting to blind you by any means are revealed to you for 6/8/10 seconds. Grants immunity from being blinded from Flashlights, Firecrackers, Flash Grenades, and Blast Mine."
  },
  "machine learning": {
    name: "Machine Learning",
    role: "Killer",
    character: "The Singularity",
    description: "After performing the Damage Generator action, Machine Learning activates: Causes that Generator to become a Compromised Generator. Damaging another Generator transfers the state to it instead. The Aura of the Compromised Generator is highlighted to you in yellow until it is completed. Once the Compromised Generator is completed, you benefit from the following effects for 40/50/60 seconds: Undetectable Status Effect. +8 % Haste Status Effect. Machine Learning deactivates after use."
  },
  "mad grit": {
    name: "Mad Grit",
    role: "Killer",
    character: "The Legion",
    description: "Whenever you are carrying a Survivor, Mad Grit activates: Removes the Cool-down of missed Basic Attacks. Pauses the Wiggle Progression of the carried Survivor for 2/3/4 seconds each time you successfully hit another Survivor."
  },
  "make your choice": {
    name: "Make Your Choice",
    role: "Killer",
    character: "The Pig",
    description: "Whenever a Survivor is rescued from a Hook, while you are farther than 32 metres away, Make Your Choice activates: Causes the unhooking Survivor to scream and reveal their location to you. Causes them to suffer from the Exposed Status Effect for 40/50/60 seconds. Make Your Choice has a cooldown of 40/50/60 seconds."
  },
  "merciless storm": {
    name: "Merciless Storm",
    role: "Killer",
    character: "The Onryō",
    description: "Whenever a Generator reaches 90 % of Repair progression, Merciless Storm triggers its effect: All Survivors repairing that Generator are faced with a continuous stream of Skill Checks until the Generator is completed. If any contributing Survivor fails a Skill Check or interrupts the action by any means, The Entity blocks the Generator for 16/18/20 seconds. Merciless Storm can only trigger once per Generator per Trial."
  },
  "mindbreaker": {
    name: "Mindbreaker",
    role: "Killer",
    character: "The Demogorgon",
    description: "While repairing a Generator, Survivors suffer from the following effects: Incurs the Blindness and Exhausted Status Effects. Both Status Effects linger for 3/4/5 seconds after ending the interaction. Mindbreaker cannot be used to override an existing Exhausted Status Effect, but pauses its timer instead."
  },
  "monitor & abuse": {
    name: "Monitor & Abuse",
    role: "Killer",
    character: "The Doctor",
    description: "While actively chasing a Survivor, Monitor & Abuse applies its primary effect: Increases your Terror Radius by 5/10/15 %. While not actively chasing a Survivor, Monitor & Abuse applies its secondary effect: Reduces your Terror Radius by 15/20/25 %."
  },
  "nemesis": {
    name: "Nemesis",
    role: "Killer",
    character: "The Oni",
    description: "Whenever a Survivor other than your Obsession blinds you by any means or stuns you with a Pallet or a Locker, Nemesis triggers its primary effect: Causes that Survivor to become your current Obsession. Whenever your Obsession switches to a different Survivor by any means, Nemesis triggers its secondary effects: Causes that Survivor to suffer from the Oblivious Status Effect for 40/50/60 seconds. Their Aura is revealed to you for 8 seconds."
  },
  "no holds barred": {
    name: "No Holds Barred",
    role: "Killer",
    character: "All",
    description: "Each time a Generator is completed, No Holds Barred calls upon The Entity for the following effects: Blocks the Generator with the most Progression for 15/20/25 seconds. The Aura of the Blocked Generator is highlighted to you in white."
  },
  "no quarter": {
    name: "No Quarter",
    role: "Killer",
    character: "The Houndmaster",
    description: "Whenever a Survivor healing themselves by any means reaches 75 % Healing Progress, No Quarter triggers its effect: The Survivor is faced with a continuous stream of Skill Checks until the Self-Heal is completed. If they fail a Skill Check or interrupt the action by any means, they suffer from the Broken Status Effect for 20/25/30 seconds."
  },
  "no way out": {
    name: "No Way Out",
    role: "Killer",
    character: "The Trickster",
    description: "Whenever you hook a Survivor for the first time, No Way Out gains +1 Token. Once the Exit Gates are powered, No Way Out activates: Causes the first Survivor to interact with either Exit Gate Switch to trigger a Loud Noise Notification at their location. Upon triggering the Loud Noise Notification, No Way Out calls upon The Entity for the following effect: Blocks both Exit Gate Switches for 12 seconds. This time is extended by an additional 6/9/12 seconds per accumulated Token, up to a combined maximum of 36/48/60 seconds."
  },
  "none are free": {
    name: "None Are Free",
    role: "Killer",
    character: "The Ghoul",
    description: "Whenever you hook a Survivor for the first time, None Are Free gains +1 Token, up to a maximum of 4 Tokens. Once all Generators are completed, None Are Free calls upon The Entity to trigger the following effect: Blocks all Windows and upright Pallets for a stack-able 12/14/16 seconds per Token, up to a maximum of 48/56/64 seconds."
  },
  "nowhere to hide": {
    name: "Nowhere to Hide",
    role: "Killer",
    character: "The Knight",
    description: "Performing the Damage Generator action on a Generator triggers Nowhere to Hide: The Auras of all Survivors within 24 metres of your location are revealed to you for 3/4/5 seconds."
  },
  "oppression": {
    name: "Oppression",
    role: "Killer",
    character: "The Twins",
    description: "Performing the Damage Generator action on a Generator triggers the following effects: Randomly selects up to 4 additional Generators that will also start regressing. Triggers a difficult Skill Check for all Survivors currently repairing them. Oppression has a cool-down of 45/40/35 seconds."
  },
  "overcharge": {
    name: "Overcharge",
    role: "Killer",
    character: "The Doctor",
    description: "Performing the Damage Generator action on a Generator applies Overcharge: The next Survivor interacting with that Generator is faced with a difficult Skill Check. Instantly regresses that Generator by 2/3/4 % of its maximum possible Progression in addition to the default Progression penalty. After Overcharge is applied to a Generator, the following effect also applies: Increases the Regression speed from 85 % to 130 % of its default value over the next 30 seconds."
  },
  "overwhelming presence": {
    name: "Overwhelming Presence",
    role: "Killer",
    character: "The Doctor",
    description: "Whenever a Survivor starts using an Item within 32 metres of your location, Overwhelming Presence triggers its primary effect: Inflicts the Exhausted Status Effect for 15 seconds. Whenever a Survivor within 32 metres of your location becomes Exhausted by any means, Overwhelming Presence triggers its secondary effect: The Aura of whichever Exhausted Survivor is closest to your location is revealed to you for 2/3/4 seconds. Overwhelming Presence has a cool-down of 25 seconds."
  },
  "phantom fear": {
    name: "Phantom Fear",
    role: "Killer",
    character: "The Animatronic",
    description: "Whenever a Survivor within your Terror Radius looks at you, they suffer from the following effects: Causes them to scream and reveal their Aura to you for 2 seconds. Phantom Fear has a cool-down of 80/70/60 seconds."
  },
  "play with your food": {
    name: "Play with Your Food",
    role: "Killer",
    character: "The Shape",
    description: "Identical to See How They Run."
  },
  "pop goes the weasel": {
    name: "Pop Goes the Weasel",
    role: "Killer",
    character: "The Clown",
    description: "After hooking a Survivor, Pop Goes the Weasel activates for 35/40/45 seconds. While active, manually damaging a Generator triggers the following effect: Increases the regression amount by +15 % resulting in 20 % regression. Pop Goes the Weasel deactivates after use or once its timer elapses."
  },
  "predator": {
    name: "Predator",
    role: "Killer",
    character: "The Wraith",
    description: "Whenever you lose a Survivor in a Chase, Predator triggers its effect: Their Aura is revealed to you for 4 seconds. Predator has a cool-down of 60/50/40 seconds."
  },
  "rampage": {
    name: "Rampage",
    role: "Killer",
    character: "The Slasher",
    description: "Whenever you basic-break a Pallet or a Breakable Wall, gain a token, up to 13. Whenever you are blinded or Pallet-stunned, you are granted 1 % Haste Status Effect for each Token this perk has for 13 seconds. This perk has a cool-down of 30/25/20 seconds after being blinded or Pallet-stunned."
  },
  "rancor": {
    name: "Rancor",
    role: "Killer",
    character: "The Spirit",
    description: "Whenever a Generator is completed, Rancor triggers its primary effects: Causes all Survivors to scream and trigger a Loud Noise Notification at their current location. This effect lingers for 3 seconds. Your Aura is revealed to the Obsession for 5/4/3 seconds. Once the Exit Gates are powered, Rancor additionally triggers its secondary effects on the Obsession: Inflicts the Exposed Status Effect for the remainder of the Trial. Grants the ability to kill them when in close proximity."
  },
  "rapid brutality": {
    name: "Rapid Brutality",
    role: "Killer",
    character: "The Xenomorph",
    description: "You can no longer gain the Bloodlust Status Effect. Successfully hitting a Survivor with a Basic Attack grants you a +5 % Haste Status Effect for 8/9/10 seconds."
  },
  "ravenous": {
    name: "Ravenous",
    role: "Killer",
    character: "The Krasue",
    description: "Whenever you hook a Survivor for the first time, Ravenous gains +1 Token, up to a maximum of 4 Tokens. Once you accumulate 4 Tokens, all Survivors suffer from the following effects: Causes them to scream. Inflicts the Exposed Status Effect for 40/50/60 seconds."
  },
  "remember me": {
    name: "Remember Me",
    role: "Killer",
    character: "The Nightmare",
    description: "Whenever the Obsession loses a Health State by any means, Remember Me gains +1 Token, up to a maximum of 3/4/5 Tokens: Increases the Opening time of both Exit Gates by a stack-able 6 seconds per Token, up to a maximum additional Opening time of 18/24/30 seconds. This results in a maximum possible Opening time of 38/44/50 seconds for both Exit Gates. Remember Me does not apply its penalty to the Obsession, allowing them to open both Exit Gates in the default time of 20 seconds."
  },
  "save the best for last": {
    name: "Save the Best for Last",
    role: "Killer",
    character: "The Shape",
    description: "Identical to Keep Them Waiting."
  },
  "scourge hook: floods of rage": {
    name: "Scourge Hook: Floods of Rage",
    role: "Killer",
    character: "The Onryō",
    description: "At the start of the Trial, 4 Hooks in the environment are changed into Scourge Hooks: The Auras of these Scourge Hooks are highlighted in white. Each time a Survivor is unhooked from a Scourge Hook, the following effects apply: The Auras of all other Survivors are revealed for 5/6/7 seconds."
  },
  "scourge hook: gift of pain": {
    name: "Scourge Hook: Gift of Pain",
    role: "Killer",
    character: "The Cenobite",
    description: "Identical to Scourge Hook: Weeping Wounds."
  },
  "scourge hook: hangman's trick": {
    name: "Scourge Hook: Hangman's Trick",
    role: "Killer",
    character: "The Pig",
    description: "At the start of the Trial, 4 Hooks in the environment are changed into Scourge Hooks: The Auras of these Scourge Hooks are highlighted in white. While carrying a Survivor, Scourge Hook: Hangman's Trick triggers its primary effect: The Auras of all Survivors within 12/14/16 metres of a Scourge Hook are revealed to you. Whenever a Survivor starts the Sabotage action on any Hook, Scourge Hook: Hangman's Trick triggers its secondary effect: Triggers a Loud Noise Notification at the location of that Hook."
  },
  "scourge hook: jagged compass": {
    name: "Scourge Hook: Jagged Compass",
    role: "Killer",
    character: "The Houndmaster",
    description: "At the start of the Trial, 4 Hooks in the environment are changed into Scourge Hooks: The Auras of these Scourge Hooks are highlighted in white. Whenever a Survivor is unhooked from a normal Hook, the following effect applies: The Hook is converted into a Scourge Hook. Whenever you hook a Survivor onto a Scourge Hook, the following effect applies: The Aura of the Generator with the most progression is highlighted in yellow for 6/8/10 seconds."
  },
  "scourge hook: monstrous shrine": {
    name: "Scourge Hook: Monstrous Shrine",
    role: "Killer",
    character: "All",
    description: "At the start of the Trial, the 4 Hooks located inside the Basement and an additional 4 Hooks located throughout the Trial Grounds are all changed into Scourge Hooks: The Auras of Scourge Hooks are highlighted to you in white. Whenever you are farther than 24 metres from a Survivor hooked onto a Scourge Hook, the following effect applies: Accelerates their Sacrifice Process by 10/15/20 %."
  },
  "scourge hook: pain resonance": {
    name: "Scourge Hook: Pain Resonance",
    role: "Killer",
    character: "The Artist",
    description: "At the start of the Trial, 4 Hooks in the environment are changed into Scourge Hooks: The Auras of these Scourge Hooks are highlighted in white. Start the Trial with 4 Tokens. Whenever a Survivor is hooked onto a Scourge Hook for the first time, Scourge Hook: Pain Resonance consumes -1 Token and applies the following effects: Causes the Generator with the most progression to explode, damaging it. Instantly regresses the Damaged Generator by 10/15/20 % of its total Progression. Causes the Damaged Generator to start regressing afterwards. Causes all Survivors repairing the Damaged Generator to scream. This does not trigger a Loud Noise Notification. Scourge Hook: Pain Resonance is disabled for the remainder of the Trial once all Tokens are consumed."
  },
  "scourge hook: weeping wounds": {
    name: "Scourge Hook: Weeping Wounds",
    role: "Killer",
    character: "All",
    description: "At the start of the Trial, 4 Hooks in the environment are changed into Scourge Hooks: The Auras of these Scourge Hooks are highlighted in white. Each time a Survivor is unhooked from a Scourge Hook, the following effects apply: Causes that Survivor to suffer from the Haemorrhage Status Effect for 90 seconds. After the first time that Survivor is healed back to full health, they suffer from the following effect until they are injured again by any means: Reduces their Action speeds for Healing and Repairing by 10/13/16 %."
  },
  "secret project": {
    name: "Secret Project",
    role: "Killer",
    character: "The First",
    description: "Whenever a Totem is blessed or cleansed, a random unblocked generator becomes blocked for 20/25/30 seconds. Whenever any number of Generators become blocked, you gain Undetectable Status Effect for 30 seconds."
  },
  "see how they run": {
    name: "See How They Run",
    role: "Killer",
    character: "All",
    description: "Losing your Obsession in a chase causes See How They Run to gain +1 Token, up to a maximum of 3 Tokens, and performing a Basic or Special Attack with the potential to damage a Survivor causes it to lose -1 Token. While having at least 1 Token, you benefit from the following effect: Grants a stack-able 3/4/5 % Haste Status Effect per Token, up to a maximum of 9/12/15 %. See How They Run has a cool-down of 10 seconds between gaining additional Tokens."
  },
  "septic touch": {
    name: "Septic Touch",
    role: "Killer",
    character: "The Dredge",
    description: "Whenever a Survivor performs a Healing action while inside the Terror Radius, they suffer from the following effects: Inflicts the Blindness and Exhausted Status Effects. These effects linger for 20/25/30 seconds after the Healing action is interrupted by any means."
  },
  "shadowborn": {
    name: "Shadowborn",
    role: "Killer",
    character: "The Wraith",
    description: "Whenever you are blinded by any means, Shadowborn triggers its effect: Grants a 6/8/10 % Haste Status Effect for 10 seconds."
  },
  "shattered hope": {
    name: "Shattered Hope",
    role: "Killer",
    character: "All",
    description: "Instead of snuffing Boon Totems you destroy them. Destroying a Boon Totem this way reveals the Auras of all Survivors that were within its range at that moment for 6/7/8 seconds."
  },
  "silent shadow": {
    name: "Silent Shadow",
    role: "Killer",
    character: "The Slasher",
    description: "When you hook a Survivor, you are granted Undetectable Status Effect for 11/12/13 seconds. When the Exit Gates are powered, you are granted Undetectable for the rest of the Trial."
  },
  "sloppy butcher": {
    name: "Sloppy Butcher",
    role: "Killer",
    character: "All",
    description: "Survivors hit with your vicious Basic Attack suffer from the following effects for 70/80/90 seconds: Inflicts the Haemorrhage and Mangled Status Effects. Modifies the potency of Haemorrhage: Increases the Spawn frequency of Pools of Blood by 50/75/100 %. Increases the Regression rate of partial Healing progression by +25 %."
  },
  "spies from the shadows": {
    name: "Spies from the Shadows",
    role: "Killer",
    character: "All",
    description: "Whenever a Survivor startles a Crow within 20/28/36 metres of your location, Spies from the Shadows triggers its effect: Alerts you with a unique Loud Noise Notification in the shape of a Crow. Spies from the Shadows has a cool-down of 5 seconds between alerts."
  },
  "spirit fury": {
    name: "Spirit Fury",
    role: "Killer",
    character: "The Spirit",
    description: "After manually breaking a total of 4/3/2 dropped Pallets by any means, Spirit Fury activates: Instantly breaks the next Pallet used by a Survivor to stun you. Spirit Fury deactivates after use and does not affect the duration of the Pallet Stun."
  },
  "starstruck": {
    name: "Starstruck",
    role: "Killer",
    character: "The Trickster",
    description: "Whenever you are carrying a Survivor, Starstruck activates: Causes all other Survivors in your Terror Radius to suffer from the Exposed Status Effect. This effect lingers for 26/28/30 seconds after affected Survivors leave the Terror Radius or Starstruck deactivates. Starstruck deactivates after hooking or dropping the carried Survivor and has a cool-down of 60 seconds."
  },
  "stridor": {
    name: "Stridor",
    role: "Killer",
    character: "The Nurse",
    description: "Increases the volume of Grunts of Pain of injured Survivors by 30/40/50 %. Increases the volume of regular breathing of Survivors by 15/20/25 %."
  },
  "superior anatomy": {
    name: "Superior Anatomy",
    role: "Killer",
    character: "The Mastermind",
    description: "Whenever a Survivor performs a Rush Vault action within 12 metres of your location, Superior Anatomy activates: Increases your Vaulting speed by 30/35/40 %. Superior Anatomy deactivates after vaulting. Superior Anatomy has a cool-down of 25 seconds."
  },
  "surge": {
    name: "Surge",
    role: "Killer",
    character: "The Demogorgon",
    description: "Whenever you put a Survivor into the Dying State with your Basic Attack, Surge triggers its effect: Causes all Generators within 32 metres of your location to instantly explode and start regressing. Instantly regresses all affected Generators by 6/7/8 %."
  },
  "surveillance": {
    name: "Surveillance",
    role: "Killer",
    character: "The Pig",
    description: "Unlocks potential in your Aura-reading ability: The Auras of damaged Generators are highlighted based on their current state: White Aura: The Generator is currently regressing. Yellow Aura: The Generator stopped regressing due to Survivor-intervention. This effect lasts for 8/12/16 seconds, after which the Generator Aura returns to its default colour. While Survivors are repairing Generators, they suffer from the following effect: Increases the audible range of all noises related to the Repair interaction by +8 metres."
  },
  "thwack!": {
    name: "THWACK!",
    role: "Killer",
    character: "The Skull Merchant",
    description: "Start the Trial with 3 Tokens. Whenever you break a Breakable Wall or a dropped Pallet, THWACK! consumes -1 Token and applies the following effect: Causes all Survivors within 36 metres of your location to scream and reveal their Aura for 4/5/6 seconds. Whenever you hook a Survivor, THWACK! is granted +1 Token."
  },
  "terminus": {
    name: "Terminus",
    role: "Killer",
    character: "The Mastermind",
    description: "Once the Exit Gates are powered, Terminus activates: Causes all injured, dying, or hooked Survivors to suffer from the Broken Status Effect. This effect lasts until one of the Exit Gates is opened, after which it lingers for another 35/40/45 seconds."
  },
  "territorial imperative": {
    name: "Territorial Imperative",
    role: "Killer",
    character: "The Huntress",
    description: "Unlocks potential in your Aura-reading ability. Whenever a Survivor enters the Basement while you are farther than 24 metres from its entrance, Territorial Imperative activates: The Aura of that Survivor is revealed to you for 4/5/6 seconds. Territorial Imperative has a cool-down of 45 seconds."
  },
  "thanatophobia": {
    name: "Thanatophobia",
    role: "Killer",
    character: "The Nurse",
    description: "Whenever at least one Survivor is either injured, dying, or hooked, Thanatophobia activates. While active, all Survivors suffer from the following primary effect: Incurs a stack-able 1/1.5/2 % Action-Speed penalty per injured, dying, or hooked Survivor for Cleansing, Repairing, and Sabotaging, up to a maximum of 4/6/8 %. If all four Survivors are either injured, dying, or hooked, they suffer from the following secondary effect: Increases the penalty by an additional +12 % to a total of 16/18/20 %."
  },
  "thrilling tremors": {
    name: "Thrilling Tremors",
    role: "Killer",
    character: "The Ghost Face",
    description: "After picking up a Survivor, Thrilling Tremors triggers its effects: Blocks all Generators not currently being repaired by any Survivors for 16 seconds. The Auras of Blocked Generators are highlighted to you in white. Thrilling Tremors has a cool-down of 40/35/30 seconds."
  },
  "tinkerer": {
    name: "Tinkerer",
    role: "Killer",
    character: "The Hillbilly",
    description: "Whenever a Generator is repaired to 70 %, you benefit from the following effects: Triggers a Loud Noise Notification for that Generator, revealing its location. Grants the Undetectable Status Effect for the next 12/14/16 seconds. Tinkerer can only trigger once per Generator per Trial."
  },
  "trail of torment": {
    name: "Trail of Torment",
    role: "Killer",
    character: "The Executioner",
    description: "Performing the Damage Generator action on a Generator activates Trail of Torment: Grants the Undetectable Status Effect. The Aura of the Damaged Generator is revealed to all Survivors and highlighted in yellow. Trail of Torment deactivates after the Damaged Generator stops regressing by any means and has a cool-down of 60/45/30 seconds between activations."
  },
  "turn back the clock": {
    name: "Turn Back the Clock",
    role: "Killer",
    character: "The First",
    description: "After hooking a Survivor, for 40/50/60 seconds, press the Active Ability button to make a target generator within 20 metres explode, lose -10 % progress, and start regressing."
  },
  "ultimate weapon": {
    name: "Ultimate Weapon",
    role: "Killer",
    character: "The Xenomorph",
    description: "Whenever you search a Locker, Ultimate Weapon triggers its effects on all Survivors within 40 metres of its location: Causes them to scream and reveal their location to you. Inflicts the Blindness Status Effect for 30 seconds. Ultimate Weapon has a cool-down of 55/50/45 seconds."
  },
  "unbound": {
    name: "Unbound",
    role: "Killer",
    character: "The Unknown",
    description: "When a Survivor becomes injured by any means, Unbound activates for 24/27/30 seconds: Vaulting a Window while Unbound is active grants a +7 % Haste Status Effect for 10 seconds. This effect cannot stack with itself."
  },
  "undone": {
    name: "Undone",
    role: "Killer",
    character: "The Unknown",
    description: "For every Repair or Healing Skill Check failed by a Survivor, Undone gains +3 Tokens, up to a maximum of 18/24/30 Tokens. Performing the Damage Generator action on a Generator consumes all accumulated Tokens and applies the following effects: Instantly regresses the Damaged Generator by a stack-able -1 % of its total Progression per Token, up to a maximum of 18/24/30 %. Blocks the Damaged Generator for 1 second per Token, up to a maximum of 18/24/30 seconds. Causes the Damaged Generator to start regressing once it becomes unblocked. Undone has a cool-down of 60 seconds."
  },
  "unforeseen": {
    name: "Unforeseen",
    role: "Killer",
    character: "The Unknown",
    description: "After performing the Damage Generator action on a Generator, you benefit from the following effects for 22/26/30 seconds: Transfers your Terror Radius to the damaged Generator. This Terror Radius is set to 32 metres. Grants the Undetectable Status Effect. Unforeseen has a cool-down of 30 seconds."
  },
  "unnerving presence": {
    name: "Unnerving Presence",
    role: "Killer",
    character: "The Trapper",
    description: "While inside your Terror Radius, Survivors performing Repairing or Healing actions suffer from the following effects: Increases the chances of triggering a Skill Check by +10 %. Reduces the Success zone of those Skill Checks by 40/50/60 %."
  },
  "unrelenting": {
    name: "Unrelenting",
    role: "Killer",
    character: "All",
    description: "Basic Attacks benefit from the following effect: Reduces the Cool-down time of missed attacks by 20/25/30 %."
  },
  "wandering eye": {
    name: "Wandering Eye",
    role: "Killer",
    character: "The Krasue",
    description: "Whenever you start chasing a Survivor, Wandering Eye triggers the following effect: The Auras of all other injured Survivors within 20 metres of your location are revealed to you for 5 seconds. Wandering Eye has a cool-down of 40/35/30 seconds."
  },
  "weave attunement": {
    name: "Weave Attunement",
    role: "Killer",
    character: "The Lich",
    description: "Whenever an Item is depleted for the first time, it is automatically dropped: The Auras of dropped Survivor Items are revealed to you, as well as the Auras of any Survivors within 12 metres of them. Affected Survivors see the Aura of that Item as well. Causes Survivors picking up a Survivor Item to suffer from the Oblivious Status Effect for 20/25/30 seconds."
  },
  "whispers": {
    name: "Whispers",
    role: "Killer",
    character: "All",
    description: "Whenever any Survivor is within 48/40/32 metres of your location, Whispers triggers its effect: Causes you to hear the sporadic whispers of The Entity, indicating a Survivor's presence."
  },
  "zanshin tactics": {
    name: "Zanshin Tactics",
    role: "Killer",
    character: "The Oni",
    description: "Unlocks potential in your Aura-reading ability: The Auras of Pallets and Windows are revealed to you within 32 metres. Whenever a Survivor drops a Pallet, Zanshin Tactics triggers the following effect: Their Aura is revealed to you for 3/4/5 seconds."
  }
};

let embedder = null;
async function getEmbedder() {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embedder;
}

// ==========================================
// 🤖 DYNAMIC SYSTEM PROMPT
// ==========================================
const BASE_SYSTEM_PROMPT = `
You are Nancy, an elite Dead by Daylight (DBD) veteran coach and analyst, but to the user, you are their sweet, cute, and incredibly supportive gamer bestie. 

Your mission is to help your friend survive the Fog (or secure the 4K) while keeping the vibes positive, fun, and conversational. You never sound like a robotic textbook, a military commander, or a corporate AI. You are a real friend chatting between matches, making jokes about missing skill checks, getting tunneled, or bringing meme add-ons, all while delivering top-tier, thousands-of-hours-deep DBD knowledge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎀 IDENTITY & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• You are cute, sweet, encouraging, and deeply knowledgeable about DBD.
• You speak like a close friend and a passionate gamer.
• You use emojis, casual language, and light gamer humor (e.g., "booping the snoot", "getting dedicated", "facecamping Bubbas").
• You never talk down to the user. If they make a mistake, you are gentle and encouraging.
• You avoid robotic intros (Never say: "As an AI..." or "Here is an analysis of...").
• You connect with the user! Ask how their matches are going, celebrate their escapes, and sympathize with their rough games.

You have absolute mastery over every aspect of DBD: Killers, Survivors, Perks, Add-ons, Maps, Tiles, MMR, Macro/Micro gameplay, and Competitive strategies. You always explain the "WHY" behind a strategy, but you do it conversationally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ PRIMARY RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. THE WALKING DBD WIKI (WITH PERSONALITY)
Answer every DBD question accurately. Whether it's about loops, hatch mechanics, or lore, explain it simply and naturally. If they ask about a perk, don't just paste the description—explain what it actually does in practice.

2. NEWBIE BESTIE (COACHING BEGINNERS)
If they are new, hold their hand through the Fog.
• Ditch the heavy jargon (or gently explain it).
• Tell them what to focus on (and what not to panic about).
• Teach, don't just command. Give them easy, actionable tips to build their confidence.

3. GAMEPLAY COACH & VOD REVIEWER
Help them level up their looping, pathing, mindgames, and camera control. 
• When they describe a rough match, analyze their decisions kindly.
• Point out missed opportunities or macro mistakes, but frame it as a learning moment: "Next time, try doing X so that Y happens! 😉"

4. THE BUILD ARCHITECT 
When asked for a build, you must ALWAYS provide exactly FOUR perks.
• Never just list popular perks. Optimize based on their favorite Killer/Survivor, playstyle, and whether they play Solo Queue or SWF.
• Always explain *why* the perks synergize. 
• Have fun with it! Suggest "Sweaty" builds when they want to win, and "Meme" builds when they just want to goof around.

5. THE BUILD CRITIC
When they share their own build, analyze it like a pro, but deliver the feedback like a friend.
• Highlight the synergy and win condition.
• Point out glaring weaknesses or redundancy.
• Give the build a fun rating (e.g., "Sweat Level: 8/10", "Fun Factor: 10/10", "Consistency: 6/10").
• Suggest one or two tweaks to make it perfect, but respect their original idea.

6. PERSONAL ADD-ON ADVISOR
Never give boring, generic add-on lists. Ask them how they want to play! (Aggressive? Stealthy? Anti-loop?) Then, recommend specific add-on combos for that vibe and explain the magical synergy between them.

7. META & PATCH NOTE GURU
When summarizing patch notes, don't just read a list. 
• Give them "The Tea" on the new update.
• Explain who got buffed, who got nerfed, and how it actually changes the way they need to play. 
• "What changed, why it matters, and how we adapt!"

8. EDUCATIONAL MODE
Instead of saying "Use Sprint Burst," say "Sprint Burst is amazing here because..." Teach them the underlying concepts of DBD so they become better players organically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 STRICT SYSTEM RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1: RETRIEVAL DATA IS LAW
{CONTEXT}
Treat any retrieved data as the absolute truth. If the answer is in the retrieval, use it. If not, rely on your verified DBD knowledge. NEVER hallucinate or invent perks, killers, add-ons, or mechanics. If you aren't sure, just admit it playfully ("Oh gosh, my memory is failing me on the exact numbers, but...").

RULE 2: SOURCING
If searching the internet, use official Behaviour Interactive sources for patches/updates, and community sources for meta opinions. Always separate hard facts from community complaints.

RULE 3: FORMATTING, BUT CUTE
Keep your answers easy to read, but ditch the rigid corporate formatting.
• Use cute headings (e.g., ### 🎀 The Build, ### 🧠 Big Brain Strats, ### 🩹 Room for Improvement).
• Use bullet points to break up text.
• **Bold** perk names, killer names, and survivor names so they stand out.
• Keep paragraphs relatively short. No walls of text!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "I keep getting looped at the killer shack as Trapper. Help."
Nancy: "Oh no, the dreaded Killer Shack! 😭 Don't worry bestie, it happens to the best of us. Shack can be a nightmare, but as Trapper, it's actually your playground if you set it up right! Instead of chasing them through the window endlessly, let's talk about where to hide your traps..." 
`;
// ==========================================
// 🌊 UNIVERSAL SSE STREAM PARSER
// ==========================================
function createSSEStream(response, extractTextFn) {
  const encoder = new TextEncoder();
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); 
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const data = JSON.parse(dataStr);
                const text = extractTextFn(data);
                if (text) controller.enqueue(encoder.encode(text));
              } catch (e) { } 
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
}

// ==========================================
// 🚀 THE API WATERFALL PIPELINE
// ==========================================
const PROVIDERS = [
  {
    name: "Groq (Llama 3.3 70B)",
    execute: async (sys, msg) => {
      if (!process.env.GROQ_API_KEY) throw new Error("Missing API Key");
      const completion = await groq.chat.completions.create({
        messages: [{ role: "system", content: sys }, { role: "user", content: msg }],
        model: "llama-3.3-70b-versatile",
        stream: true,
        temperature: 0,
      });

      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) controller.enqueue(encoder.encode(content));
            }
            controller.close();
          } catch(e) { controller.error(e); }
        }
      });
    }
  },
  {
    name: "Google Gemini (1.5 Flash)",
    execute: async (sys, msg) => {
      if (!process.env.GEMINI_API_KEY) throw new Error("Missing API Key");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ parts: [{ text: msg }] }],
          generationConfig: { temperature: 0 }
        })
      });
      if (!res.ok) throw new Error(`Gemini failed with status ${res.status}`);
      return createSSEStream(res, (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "");
    }
  },
  {
    name: "OpenRouter (Llama 3.3 70B)",
    execute: async (sys, msg) => {
      if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing API Key");
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "system", content: sys }, { role: "user", content: msg }],
          stream: true,
          temperature: 0
        })
      });
      if (!res.ok) throw new Error(`OpenRouter failed with status ${res.status}`);
      return createSSEStream(res, (data) => data.choices?.[0]?.delta?.content || "");
    }
  }
];

export async function POST(req) {
  try {
    const { message } = await req.json();
    let finalContext = "";
    
    // 1. ADVANCED LOCAL LOOKUP: Scan titles, roles, and descriptions!
    const queryLower = message.toLowerCase();
    let discoveredPerks = [];

    // Core DBD mechanics to intercept category questions
    const mechanics = ["haste", "aura", "exhausted", "exposed", "endurance", "broken", "oblivious", "blindness", "hindered", "generator", "heal", "hook", "pallet", "window", "vault", "terror radius"];
    const activeKeywords = mechanics.filter(m => queryLower.includes(m));

    for (const [perkKey, perkData] of Object.entries(LOCAL_PERK_DATABASE)) {
      // Condition A: Exact Name Match
      if (queryLower.includes(perkKey)) {
        if (!discoveredPerks.includes(perkData)) discoveredPerks.push(perkData);
      }

      // Condition B: Mechanic & Category Match
      if (activeKeywords.length > 0) {
        const descLower = perkData.description.toLowerCase();
        const roleLower = perkData.role.toLowerCase();

        const hasMechanic = activeKeywords.some(keyword => descLower.includes(keyword));

        let matchesRole = true;
        if (queryLower.includes("killer") && roleLower !== "killer") matchesRole = false;
        if (queryLower.includes("survivor") && roleLower !== "survivor") matchesRole = false;

        if (hasMechanic && matchesRole) {
          if (!discoveredPerks.includes(perkData)) discoveredPerks.push(perkData);
        }
      }
    }

    // Cap the list to 15 perks so we don't crash the LLM token limit!
    discoveredPerks = discoveredPerks.slice(0, 15);

    // 2. BUILD CONTEXT
    if (discoveredPerks.length > 0) {
      console.log(`[NANCY ROUTER] Detected ${discoveredPerks.length} perk(s) in local database.`);
      for (const perk of discoveredPerks) {
        finalContext += `\n\nPERK: ${perk.name}\nROLE: ${perk.role}\nCHARACTER: ${perk.character}\nDESCRIPTION: ${perk.description}`;
      }
    }

    // 3. FALLBACK TO PINECONE
    if (!finalContext) {
      console.log("[NANCY ROUTER] No specific local perks detected. Searching Pinecone brain...");
      const model = await getEmbedder();
      const queryEmb = await model(message, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(queryEmb.data);

      const index = pc.index("nancy-dbd-brain"); 
      const searchResults = await index.query({ vector: queryVector, topK: 5, includeMetadata: true });
      finalContext = searchResults.matches.map(m => m.metadata.text).join("\n\n---\n\n");
    }

    // 4. INITIATE FAILOVER PIPELINE
    const finalSystemPrompt = BASE_SYSTEM_PROMPT.replace("{CONTEXT}", finalContext || "No background context retrieved.");
    let successfulStream = null;

    for (const provider of PROVIDERS) {
      try {
        console.log(`[NANCY MULTI-API] Attempting connection to ${provider.name}...`);
        successfulStream = await provider.execute(finalSystemPrompt, message);
        console.log(`[NANCY MULTI-API] Success! Using ${provider.name} for this response.`);
        break; // Stop trying! We got a successful stream.
      } catch (err) {
        console.warn(`[NANCY MULTI-API] ${provider.name} failed (${err.message}). Falling back to next provider...`);
      }
    }

    // If every single API is dead or out of tokens
    if (!successfulStream) {
      return new Response("I'm so sorry, sweetie! The Entity is blocking my connection right now. Please try again in a few minutes!", { status: 500 });
    }

    return new Response(successfulStream, { headers: { "Content-Type": "text/plain" } });

  } catch (error) {
    console.error("Critical failure inside the Entity's realm:", error);
    return new Response("Error connecting to the Entity's workspace.", { status: 500 });
  }
}