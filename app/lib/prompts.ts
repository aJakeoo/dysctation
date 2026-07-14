export interface Prompt {
  text: string;
  category: string;
}

export const CATEGORY_NOTES: Record<string, string> = {
  Clinical: "Say this phrase rhythmically, as quickly and clearly as you can.",
};

const EVERYDAY: string[] = [
  "Can you send me that file?",
  "I'll be there in ten minutes.",
  "What time does it start?",
  "Could you repeat that please?",
  "I need a little more time.",
  "Turn left at the next street.",
  "Can you open the door for me?",
  "I'd like to order the soup.",
  "My phone is almost out of battery.",
  "Can we schedule that for tomorrow?",
  "I appreciate your patience.",
  "Please speak a little slower.",
  "The meeting is at three o'clock.",
  "I need help with this form.",
  "Thank you for waiting.",

  // Harvard Sentences
  "The birch canoe slid on the smooth planks.",
  "Glue the sheet to the dark blue background.",
  "Rice is often served in round bowls.",
  "The juice of lemons makes fine punch.",
  "The box was thrown beside the parked truck.",
  "Four hours of steady work faced us.",
  "The boy was there when the sun rose.",
  "Kick the ball straight and follow through.",
  "A pot of tea helps to pass the evening.",
  "The soft cushion broke the man's fall.",
  "The fish twisted and turned on the bent hook.",
  "The beauty of the view stunned the young boy.",
  "The wrist was badly strained and hung limp.",
  "The meal was cooked before the bell rang.",
  "The ship was torn apart on the sharp reef.",
  "The wide road shimmered in the hot sun.",
  "The rope will bind the seven books at once.",
  "The wagon moved on well oiled wheels.",
  "A cup of sugar makes sweet fudge.",
  "Both lost their lives in the raging storm.",
  "The clock struck to mark the third period.",
  "The set of china hit the floor with a crash.",
  "The ink stain dried on the finished page.",
  "The heart beat strongly and with firm strokes.",
  "The pearl was worn in a thin silver ring.",
  "See the cat glaring at the scared mouse.",
  "The grass curled around the fence post.",
  "The slush lay deep along the street.",
  "A wisp of cloud hung in the blue air.",
  "The fin was sharp and cut the clear water.",
];

const CONSONANT_HEAVY: string[] = [
  "Peter picked a peck of pickled peppers.",
  "She sells seashells by the seashore.",
  "Specifically, the staff struggled significantly.",
  "The quick brown fox jumps over the lazy dog.",
  "Crispy crackers crumble quickly.",
  "Proper preparation prevents poor performance.",
  "Fresh french fries from Friday's fryer.",
  "Black bugs bleed blue-black blood.",
  "Six slippery snails slid slowly seaward.",
  "Thick thistles and twisted twigs.",
];

const FA_SPECIFIC: string[] = [
  "Friedreich's Ataxia affects coordination and balance.",
  "My occupational therapist visits on Thursdays.",
  "I use a power wheelchair for mobility.",
  "The accessibility ramp is around the corner.",
  "My speech therapist recommended this exercise.",
  "FARA funds research into hereditary ataxia.",
  "I take my medication twice daily with food.",
  "The neurologist reviewed my MRI results.",
  "Assistive technology helps me communicate better.",
  "My caregiver helps me with daily activities.",
];

const LONGER: string[] = [
  "I wanted to let you know that I will be arriving a few minutes late to our appointment today.",
  "The weather has been quite unpredictable lately and I am not sure what to wear when I go outside.",
  "Could you please help me find the accessible entrance to this building because I cannot locate it.",
  "I have been using this dictation tool for several weeks now and it has made a big difference in my daily life.",
  "My physical therapist suggested that I try some new exercises to help improve my strength and endurance over time.",
  "I would really appreciate it if you could slow down a little because I am having some difficulty following what you are saying.",
  "The conference on rare diseases starts next Monday and I am planning to attend and speak about my experience.",
  "Technology has opened up so many new possibilities for people with disabilities and I am excited about what is coming next.",
];

const NUMBERS_AND_NOUNS: string[] = [
  "My appointment is on June fifteenth at two thirty.",
  "The address is four twenty two North Michigan Avenue.",
  "Call me back at seven three one, five five five, oh nine two one.",
  "The medication dosage is two hundred and fifty milligrams.",
  "My insurance ID number is A B C one two three four five.",
  "The conference is in Washington DC from October third to fifth.",
  "I was born on March eighth, two thousand and six.",
];

const CLINICAL: string[] = [
  "Pa-ta-ka, pa-ta-ka, pa-ta-ka, pa-ta-ka, pa-ta-ka.",
  "Pa-pa-pa-pa-pa.",
  "Ta-ta-ta-ta-ta.",
  "Ka-ka-ka-ka-ka.",
  "Buttercup, buttercup, buttercup, buttercup, buttercup.",
];

function toPrompts(texts: string[], category: string): Prompt[] {
  return texts.map((text) => ({ text, category }));
}

export const PROMPTS: Prompt[] = [
  ...toPrompts(EVERYDAY, "Everyday"),
  ...toPrompts(CONSONANT_HEAVY, "Consonant-heavy"),
  ...toPrompts(FA_SPECIFIC, "FA-specific"),
  ...toPrompts(LONGER, "Longer"),
  ...toPrompts(NUMBERS_AND_NOUNS, "Numbers"),
  ...toPrompts(CLINICAL, "Clinical"),
];

export function shufflePrompts(prompts: Prompt[]): Prompt[] {
  const shuffled = [...prompts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
