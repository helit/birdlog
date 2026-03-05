import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const swedishBirds = [
  // Tättingar (Passerines)
  { swedishName: "Talgoxe", scientificName: "Parus major", englishName: "Great Tit", family: "Mesar" },
  { swedishName: "Blåmes", scientificName: "Cyanistes caeruleus", englishName: "Blue Tit", family: "Mesar" },
  { swedishName: "Svartmes", scientificName: "Periparus ater", englishName: "Coal Tit", family: "Mesar" },
  { swedishName: "Tofsmes", scientificName: "Lophophanes cristatus", englishName: "Crested Tit", family: "Mesar" },
  { swedishName: "Entita", scientificName: "Poecile palustris", englishName: "Marsh Tit", family: "Mesar" },
  { swedishName: "Koltrast", scientificName: "Turdus merula", englishName: "Eurasian Blackbird", family: "Trastar" },
  { swedishName: "Rödvingetrast", scientificName: "Turdus iliacus", englishName: "Redwing", family: "Trastar" },
  { swedishName: "Björktrast", scientificName: "Turdus pilaris", englishName: "Fieldfare", family: "Trastar" },
  { swedishName: "Taltrast", scientificName: "Turdus philomelos", englishName: "Song Thrush", family: "Trastar" },
  { swedishName: "Dubbeltrast", scientificName: "Turdus viscivorus", englishName: "Mistle Thrush", family: "Trastar" },
  { swedishName: "Rödhake", scientificName: "Erithacus rubecula", englishName: "European Robin", family: "Flugsnappare" },
  { swedishName: "Bofink", scientificName: "Fringilla coelebs", englishName: "Common Chaffinch", family: "Finkar" },
  { swedishName: "Bergfink", scientificName: "Fringilla montifringilla", englishName: "Brambling", family: "Finkar" },
  { swedishName: "Grönfink", scientificName: "Chloris chloris", englishName: "European Greenfinch", family: "Finkar" },
  { swedishName: "Steglits", scientificName: "Carduelis carduelis", englishName: "European Goldfinch", family: "Finkar" },
  { swedishName: "Grönsiska", scientificName: "Spinus spinus", englishName: "Eurasian Siskin", family: "Finkar" },
  { swedishName: "Domherre", scientificName: "Pyrrhula pyrrhula", englishName: "Eurasian Bullfinch", family: "Finkar" },
  { swedishName: "Pilfink", scientificName: "Passer montanus", englishName: "Eurasian Tree Sparrow", family: "Sparvfåglar" },
  { swedishName: "Gråsparv", scientificName: "Passer domesticus", englishName: "House Sparrow", family: "Sparvfåglar" },
  { swedishName: "Skata", scientificName: "Pica pica", englishName: "Eurasian Magpie", family: "Kråkfåglar" },
  { swedishName: "Kråka", scientificName: "Corvus cornix", englishName: "Hooded Crow", family: "Kråkfåglar" },
  { swedishName: "Korp", scientificName: "Corvus corax", englishName: "Common Raven", family: "Kråkfåglar" },
  { swedishName: "Kaja", scientificName: "Coloeus monedula", englishName: "Western Jackdaw", family: "Kråkfåglar" },
  { swedishName: "Nötskrika", scientificName: "Garrulus glandarius", englishName: "Eurasian Jay", family: "Kråkfåglar" },
  { swedishName: "Nötkråka", scientificName: "Nucifraga caryocatactes", englishName: "Spotted Nutcracker", family: "Kråkfåglar" },
  { swedishName: "Stare", scientificName: "Sturnus vulgaris", englishName: "Common Starling", family: "Starar" },
  { swedishName: "Sädesärla", scientificName: "Motacilla alba", englishName: "White Wagtail", family: "Ärlor" },
  { swedishName: "Forsärla", scientificName: "Motacilla cinerea", englishName: "Grey Wagtail", family: "Ärlor" },
  { swedishName: "Gärdsmyg", scientificName: "Troglodytes troglodytes", englishName: "Eurasian Wren", family: "Gärdsmygar" },
  { swedishName: "Nötväcka", scientificName: "Sitta europaea", englishName: "Eurasian Nuthatch", family: "Nötväckor" },
  { swedishName: "Trädkrypare", scientificName: "Certhia familiaris", englishName: "Eurasian Treecreeper", family: "Trädkrypare" },
  { swedishName: "Sidensvans", scientificName: "Bombycilla garrulus", englishName: "Bohemian Waxwing", family: "Sidensvansar" },

  // Hackspettar (Woodpeckers)
  { swedishName: "Större hackspett", scientificName: "Dendrocopos major", englishName: "Great Spotted Woodpecker", family: "Hackspettar" },
  { swedishName: "Mindre hackspett", scientificName: "Dryobates minor", englishName: "Lesser Spotted Woodpecker", family: "Hackspettar" },
  { swedishName: "Spillkråka", scientificName: "Dryocopus martius", englishName: "Black Woodpecker", family: "Hackspettar" },
  { swedishName: "Gröngöling", scientificName: "Picus viridis", englishName: "European Green Woodpecker", family: "Hackspettar" },

  // Rovfåglar (Birds of prey)
  { swedishName: "Ormvråk", scientificName: "Buteo buteo", englishName: "Common Buzzard", family: "Rovfåglar" },
  { swedishName: "Sparvhök", scientificName: "Accipiter nisus", englishName: "Eurasian Sparrowhawk", family: "Rovfåglar" },
  { swedishName: "Duvhök", scientificName: "Accipiter gentilis", englishName: "Northern Goshawk", family: "Rovfåglar" },
  { swedishName: "Havsörn", scientificName: "Haliaeetus albicilla", englishName: "White-tailed Eagle", family: "Rovfåglar" },
  { swedishName: "Kungsörn", scientificName: "Aquila chrysaetos", englishName: "Golden Eagle", family: "Rovfåglar" },
  { swedishName: "Tornfalk", scientificName: "Falco tinnunculus", englishName: "Common Kestrel", family: "Falkar" },

  // Ugglor (Owls)
  { swedishName: "Kattuggla", scientificName: "Strix aluco", englishName: "Tawny Owl", family: "Ugglor" },
  { swedishName: "Hornuggla", scientificName: "Asio otus", englishName: "Long-eared Owl", family: "Ugglor" },
  { swedishName: "Berguv", scientificName: "Bubo bubo", englishName: "Eurasian Eagle-Owl", family: "Ugglor" },

  // Sjöfåglar & vadarfåglar (Waterbirds & waders)
  { swedishName: "Gråhäger", scientificName: "Ardea cinerea", englishName: "Grey Heron", family: "Hägrar" },
  { swedishName: "Knölsvan", scientificName: "Cygnus olor", englishName: "Mute Swan", family: "Änder" },
  { swedishName: "Gräsand", scientificName: "Anas platyrhynchos", englishName: "Mallard", family: "Änder" },
  { swedishName: "Fiskmås", scientificName: "Larus canus", englishName: "Common Gull", family: "Måsfåglar" },
  { swedishName: "Skrattmås", scientificName: "Chroicocephalus ridibundus", englishName: "Black-headed Gull", family: "Måsfåglar" },
  { swedishName: "Havstrut", scientificName: "Larus marinus", englishName: "Great Black-backed Gull", family: "Måsfåglar" },
  { swedishName: "Sothöna", scientificName: "Fulica atra", englishName: "Eurasian Coot", family: "Rallar" },
  { swedishName: "Trana", scientificName: "Grus grus", englishName: "Common Crane", family: "Tranor" },

  // Duvor & hönsfåglar
  { swedishName: "Ringduva", scientificName: "Columba palumbus", englishName: "Common Wood Pigeon", family: "Duvor" },
  { swedishName: "Fasan", scientificName: "Phasianus colchicus", englishName: "Common Pheasant", family: "Hönsfåglar" },
];

async function main() {
  console.log("Rensar befintlig artdata...");
  await prisma.sighting.deleteMany();
  await prisma.species.deleteMany();

  console.log(`Skapar ${swedishBirds.length} svenska fågelarter...`);

  for (const bird of swedishBirds) {
    await prisma.species.create({ data: bird });
  }

  console.log("Klar! Databasseeding lyckades.");
}

main()
  .catch((e) => {
    console.error("Seeding misslyckades:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
