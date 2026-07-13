export interface Document {
  id: string;
  title: string;
  author: string;
  year: number;
  excerpt: string;
  paragraphs: string[];
}

export const DOCUMENTS: Document[] = [
  {
    id: "jfk-moon",
    title: "We Choose to Go to the Moon",
    author: "John F. Kennedy",
    year: 1962,
    excerpt:
      "We choose to go to the Moon in this decade and do the other things...",
    paragraphs: [
      "We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.",
      "Because that goal will serve to organize and measure the best of our energies and skills, because that challenge is one that we are willing to accept, one we are unwilling to postpone, and one we intend to win.",
      "There is no strife, no prejudice, no national conflict in outer space as yet. Its hazards are hostile to us all. Its conquest deserves the best of all mankind, and its opportunity for peaceful cooperation may never come again.",
      "But why, some say, the Moon? Why choose this as our goal? And they may well ask why climb the highest mountain? Why, thirty five years ago, fly the Atlantic? Why does Rice play Texas?",
      "We set sail on this new sea because there is new knowledge to be gained, and new rights to be won, and they must be won and used for the progress of all people.",
      "Many years ago the great British explorer George Mallory, who was to die on Mount Everest, was asked why he wanted to climb it. He said, because it is there. Well, space is there, and we're going to climb it, and the Moon and the planets are there, and new hopes for knowledge and peace are there.",
      "And therefore, as we set sail, we ask God's blessing on the most hazardous and dangerous and greatest adventure on which man has ever embarked.",
    ],
  },
  {
    id: "gettysburg",
    title: "The Gettysburg Address",
    author: "Abraham Lincoln",
    year: 1863,
    excerpt:
      "Four score and seven years ago our fathers brought forth on this continent...",
    paragraphs: [
      "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.",
      "Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.",
      "We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.",
      "It is altogether fitting and proper that we should do this. But, in a larger sense, we can not dedicate, we can not consecrate, we can not hallow this ground.",
      "The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract.",
      "The world will little note, nor long remember what we say here, but it can never forget what they did here.",
      "It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced.",
      "It is rather for us to be here dedicated to the great task remaining before us, that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion.",
      "We here highly resolve that these dead shall not have died in vain, that this nation, under God, shall have a new birth of freedom, and that government of the people, by the people, for the people, shall not perish from the earth.",
    ],
  },
  {
    id: "fdr-inaugural",
    title: "First Inaugural Address",
    author: "Franklin D. Roosevelt",
    year: 1933,
    excerpt: "The only thing we have to fear is fear itself...",
    paragraphs: [
      "The only thing we have to fear is fear itself, nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance.",
      "In every dark hour of our national life a leadership of frankness and of vigor has met with that understanding and support of the people themselves which is essential to victory.",
      "This is preeminently the time to speak the truth, the whole truth, frankly and boldly. Nor need we shrink from honestly facing conditions in our country today.",
      "This great Nation will endure, as it has endured, will revive and will prosper. So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself.",
    ],
  },
  {
    id: "declaration",
    title: "Declaration of Independence (excerpt)",
    author: "Thomas Jefferson",
    year: 1776,
    excerpt:
      "We hold these truths to be self-evident, that all men are created equal...",
    paragraphs: [
      "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.",
      "That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed.",
      "That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government.",
      "Laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.",
    ],
  },
  {
    id: "mlk-dream",
    title: "I Have a Dream (excerpt)",
    author: "Martin Luther King Jr.",
    year: 1963,
    excerpt: "I have a dream that one day this nation will rise up...",
    paragraphs: [
      "I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal.",
      "I have a dream that one day on the red hills of Georgia, the sons of former slaves and the sons of former slave owners will be able to sit down together at the table of brotherhood.",
      "I have a dream that one day even the state of Mississippi, a state sweltering with the heat of injustice, sweltering with the heat of oppression, will be transformed into an oasis of freedom and justice.",
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
      "And when this happens, and when we allow freedom to ring, when we let it ring from every village and every hamlet, from every state and every city, we will be able to speed up that day when all of God's children will be able to join hands and sing in the words of the old Negro spiritual: Free at last. Free at last. Thank God Almighty, we are free at last.",
    ],
  },
];
