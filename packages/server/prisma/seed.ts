import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const swedishBirds = [
  // Mesar (Tits)
  { swedishName: "Talgoxe", scientificName: "Parus major", englishName: "Great Tit", family: "Mesar" },
  { swedishName: "Blåmes", scientificName: "Cyanistes caeruleus", englishName: "Blue Tit", family: "Mesar" },
  { swedishName: "Svartmes", scientificName: "Periparus ater", englishName: "Coal Tit", family: "Mesar" },
  { swedishName: "Tofsmes", scientificName: "Lophophanes cristatus", englishName: "Crested Tit", family: "Mesar" },
  { swedishName: "Entita", scientificName: "Poecile palustris", englishName: "Marsh Tit", family: "Mesar" },
  { swedishName: "Talltita", scientificName: "Poecile montanus", englishName: "Willow Tit", family: "Mesar" },
  { swedishName: "Lappmes", scientificName: "Poecile cinctus", englishName: "Siberian Tit", family: "Mesar" },
  { swedishName: "Skäggmes", scientificName: "Panurus biarmicus", englishName: "Bearded Reedling", family: "Mesar" },
  { swedishName: "Stjärtmes", scientificName: "Aegithalos caudatus", englishName: "Long-tailed Tit", family: "Stjärtmesar" },

  // Trastar (Thrushes)
  { swedishName: "Koltrast", scientificName: "Turdus merula", englishName: "Eurasian Blackbird", family: "Trastar" },
  { swedishName: "Rödvingetrast", scientificName: "Turdus iliacus", englishName: "Redwing", family: "Trastar" },
  { swedishName: "Björktrast", scientificName: "Turdus pilaris", englishName: "Fieldfare", family: "Trastar" },
  { swedishName: "Taltrast", scientificName: "Turdus philomelos", englishName: "Song Thrush", family: "Trastar" },
  { swedishName: "Dubbeltrast", scientificName: "Turdus viscivorus", englishName: "Mistle Thrush", family: "Trastar" },
  { swedishName: "Ringtrast", scientificName: "Turdus torquatus", englishName: "Ring Ouzel", family: "Trastar" },

  // Flugsnappare & småfåglar (Flycatchers & chats)
  { swedishName: "Rödhake", scientificName: "Erithacus rubecula", englishName: "European Robin", family: "Flugsnappare" },
  { swedishName: "Svartvit flugsnappare", scientificName: "Ficedula hypoleuca", englishName: "European Pied Flycatcher", family: "Flugsnappare" },
  { swedishName: "Grå flugsnappare", scientificName: "Muscicapa striata", englishName: "Spotted Flycatcher", family: "Flugsnappare" },
  { swedishName: "Mindre flugsnappare", scientificName: "Ficedula parva", englishName: "Red-breasted Flycatcher", family: "Flugsnappare" },
  { swedishName: "Halsbandsflugsnappare", scientificName: "Ficedula albicollis", englishName: "Collared Flycatcher", family: "Flugsnappare" },
  { swedishName: "Blåhake", scientificName: "Luscinia svecica", englishName: "Bluethroat", family: "Flugsnappare" },
  { swedishName: "Näktergal", scientificName: "Luscinia luscinia", englishName: "Thrush Nightingale", family: "Flugsnappare" },
  { swedishName: "Rödstjärt", scientificName: "Phoenicurus phoenicurus", englishName: "Common Redstart", family: "Flugsnappare" },
  { swedishName: "Svart rödstjärt", scientificName: "Phoenicurus ochruros", englishName: "Black Redstart", family: "Flugsnappare" },
  { swedishName: "Stenskvätta", scientificName: "Oenanthe oenanthe", englishName: "Northern Wheatear", family: "Flugsnappare" },
  { swedishName: "Buskskvätta", scientificName: "Saxicola rubetra", englishName: "Whinchat", family: "Flugsnappare" },
  { swedishName: "Svarthakad buskskvätta", scientificName: "Saxicola rubicola", englishName: "European Stonechat", family: "Flugsnappare" },

  // Finkar (Finches)
  { swedishName: "Bofink", scientificName: "Fringilla coelebs", englishName: "Common Chaffinch", family: "Finkar" },
  { swedishName: "Bergfink", scientificName: "Fringilla montifringilla", englishName: "Brambling", family: "Finkar" },
  { swedishName: "Grönfink", scientificName: "Chloris chloris", englishName: "European Greenfinch", family: "Finkar" },
  { swedishName: "Steglits", scientificName: "Carduelis carduelis", englishName: "European Goldfinch", family: "Finkar" },
  { swedishName: "Grönsiska", scientificName: "Spinus spinus", englishName: "Eurasian Siskin", family: "Finkar" },
  { swedishName: "Domherre", scientificName: "Pyrrhula pyrrhula", englishName: "Eurasian Bullfinch", family: "Finkar" },
  { swedishName: "Hämpling", scientificName: "Linaria cannabina", englishName: "Common Linnet", family: "Finkar" },
  { swedishName: "Vinterhämpling", scientificName: "Linaria flavirostris", englishName: "Twite", family: "Finkar" },
  { swedishName: "Gråsiska", scientificName: "Acanthis flammea", englishName: "Common Redpoll", family: "Finkar" },
  { swedishName: "Snösiska", scientificName: "Acanthis hornemanni", englishName: "Arctic Redpoll", family: "Finkar" },
  { swedishName: "Större korsnäbb", scientificName: "Loxia pytyopsittacus", englishName: "Parrot Crossbill", family: "Finkar" },
  { swedishName: "Mindre korsnäbb", scientificName: "Loxia curvirostra", englishName: "Red Crossbill", family: "Finkar" },
  { swedishName: "Bändelkorsnäbb", scientificName: "Loxia leucoptera", englishName: "Two-barred Crossbill", family: "Finkar" },
  { swedishName: "Tallbit", scientificName: "Pinicola enucleator", englishName: "Pine Grosbeak", family: "Finkar" },
  { swedishName: "Stenknäck", scientificName: "Coccothraustes coccothraustes", englishName: "Hawfinch", family: "Finkar" },
  { swedishName: "Gulhämpling", scientificName: "Serinus serinus", englishName: "European Serin", family: "Finkar" },

  // Sparvfåglar (Sparrows)
  { swedishName: "Pilfink", scientificName: "Passer montanus", englishName: "Eurasian Tree Sparrow", family: "Sparvfåglar" },
  { swedishName: "Gråsparv", scientificName: "Passer domesticus", englishName: "House Sparrow", family: "Sparvfåglar" },

  // Kråkfåglar (Corvids)
  { swedishName: "Skata", scientificName: "Pica pica", englishName: "Eurasian Magpie", family: "Kråkfåglar" },
  { swedishName: "Kråka", scientificName: "Corvus cornix", englishName: "Hooded Crow", family: "Kråkfåglar" },
  { swedishName: "Svartkråka", scientificName: "Corvus corone", englishName: "Carrion Crow", family: "Kråkfåglar" },
  { swedishName: "Korp", scientificName: "Corvus corax", englishName: "Common Raven", family: "Kråkfåglar" },
  { swedishName: "Råka", scientificName: "Corvus frugilegus", englishName: "Rook", family: "Kråkfåglar" },
  { swedishName: "Kaja", scientificName: "Coloeus monedula", englishName: "Western Jackdaw", family: "Kråkfåglar" },
  { swedishName: "Nötskrika", scientificName: "Garrulus glandarius", englishName: "Eurasian Jay", family: "Kråkfåglar" },
  { swedishName: "Nötkråka", scientificName: "Nucifraga caryocatactes", englishName: "Spotted Nutcracker", family: "Kråkfåglar" },
  { swedishName: "Lavskrika", scientificName: "Perisoreus infaustus", englishName: "Siberian Jay", family: "Kråkfåglar" },

  // Starar (Starlings)
  { swedishName: "Stare", scientificName: "Sturnus vulgaris", englishName: "Common Starling", family: "Starar" },

  // Ärlor & piplärkor (Wagtails & pipits)
  { swedishName: "Sädesärla", scientificName: "Motacilla alba", englishName: "White Wagtail", family: "Ärlor" },
  { swedishName: "Forsärla", scientificName: "Motacilla cinerea", englishName: "Grey Wagtail", family: "Ärlor" },
  { swedishName: "Gulärla", scientificName: "Motacilla flava", englishName: "Western Yellow Wagtail", family: "Ärlor" },
  { swedishName: "Ängspiplärka", scientificName: "Anthus pratensis", englishName: "Meadow Pipit", family: "Ärlor" },
  { swedishName: "Trädpiplärka", scientificName: "Anthus trivialis", englishName: "Tree Pipit", family: "Ärlor" },
  { swedishName: "Rödstrupig piplärka", scientificName: "Anthus cervinus", englishName: "Red-throated Pipit", family: "Ärlor" },
  { swedishName: "Skärpiplärka", scientificName: "Anthus petrosus", englishName: "Rock Pipit", family: "Ärlor" },
  { swedishName: "Vattenpiplärka", scientificName: "Anthus spinoletta", englishName: "Water Pipit", family: "Ärlor" },

  // Sångare (Warblers)
  { swedishName: "Lövsångare", scientificName: "Phylloscopus trochilus", englishName: "Willow Warbler", family: "Sångare" },
  { swedishName: "Gransångare", scientificName: "Phylloscopus collybita", englishName: "Common Chiffchaff", family: "Sångare" },
  { swedishName: "Grönsångare", scientificName: "Phylloscopus sibilatrix", englishName: "Wood Warbler", family: "Sångare" },
  { swedishName: "Lundsångare", scientificName: "Phylloscopus trochiloides", englishName: "Greenish Warbler", family: "Sångare" },
  { swedishName: "Svarthätta", scientificName: "Sylvia atricapilla", englishName: "Eurasian Blackcap", family: "Sångare" },
  { swedishName: "Trädgårdssångare", scientificName: "Sylvia borin", englishName: "Garden Warbler", family: "Sångare" },
  { swedishName: "Ärtsångare", scientificName: "Curruca curruca", englishName: "Lesser Whitethroat", family: "Sångare" },
  { swedishName: "Törnsångare", scientificName: "Curruca communis", englishName: "Common Whitethroat", family: "Sångare" },
  { swedishName: "Höksångare", scientificName: "Curruca nisoria", englishName: "Barred Warbler", family: "Sångare" },
  { swedishName: "Rörsångare", scientificName: "Acrocephalus scirpaceus", englishName: "Eurasian Reed Warbler", family: "Sångare" },
  { swedishName: "Kärrsångare", scientificName: "Acrocephalus palustris", englishName: "Marsh Warbler", family: "Sångare" },
  { swedishName: "Trastsångare", scientificName: "Acrocephalus arundinaceus", englishName: "Great Reed Warbler", family: "Sångare" },
  { swedishName: "Sävsångare", scientificName: "Acrocephalus schoenobaenus", englishName: "Sedge Warbler", family: "Sångare" },
  { swedishName: "Sävsparvsångare", scientificName: "Acrocephalus paludicola", englishName: "Aquatic Warbler", family: "Sångare" },
  { swedishName: "Gräshoppsångare", scientificName: "Locustella naevia", englishName: "Common Grasshopper Warbler", family: "Sångare" },
  { swedishName: "Flodsångare", scientificName: "Locustella fluviatilis", englishName: "River Warbler", family: "Sångare" },
  { swedishName: "Härmsångare", scientificName: "Hippolais icterina", englishName: "Icterine Warbler", family: "Sångare" },
  { swedishName: "Kungsfågel", scientificName: "Regulus regulus", englishName: "Goldcrest", family: "Kungsfåglar" },
  { swedishName: "Brandkronad kungsfågel", scientificName: "Regulus ignicapilla", englishName: "Common Firecrest", family: "Kungsfåglar" },

  // Fältsparvar (Buntings)
  { swedishName: "Gulsparv", scientificName: "Emberiza citrinella", englishName: "Yellowhammer", family: "Fältsparvar" },
  { swedishName: "Ortolansparv", scientificName: "Emberiza hortulana", englishName: "Ortolan Bunting", family: "Fältsparvar" },
  { swedishName: "Sävsparv", scientificName: "Emberiza schoeniclus", englishName: "Common Reed Bunting", family: "Fältsparvar" },
  { swedishName: "Videsparv", scientificName: "Emberiza rustica", englishName: "Rustic Bunting", family: "Fältsparvar" },
  { swedishName: "Lappsparv", scientificName: "Calcarius lapponicus", englishName: "Lapland Longspur", family: "Fältsparvar" },
  { swedishName: "Snösparv", scientificName: "Plectrophenax nivalis", englishName: "Snow Bunting", family: "Fältsparvar" },
  { swedishName: "Kornsparv", scientificName: "Emberiza calandra", englishName: "Corn Bunting", family: "Fältsparvar" },

  // Övriga tättingar (Other passerines)
  { swedishName: "Gärdsmyg", scientificName: "Troglodytes troglodytes", englishName: "Eurasian Wren", family: "Gärdsmygar" },
  { swedishName: "Nötväcka", scientificName: "Sitta europaea", englishName: "Eurasian Nuthatch", family: "Nötväckor" },
  { swedishName: "Trädkrypare", scientificName: "Certhia familiaris", englishName: "Eurasian Treecreeper", family: "Trädkrypare" },
  { swedishName: "Sidensvans", scientificName: "Bombycilla garrulus", englishName: "Bohemian Waxwing", family: "Sidensvansar" },
  { swedishName: "Strömstare", scientificName: "Cinclus cinclus", englishName: "White-throated Dipper", family: "Strömstarar" },
  { swedishName: "Järnsparv", scientificName: "Prunella modularis", englishName: "Dunnock", family: "Järnsparvar" },
  { swedishName: "Törnskata", scientificName: "Lanius collurio", englishName: "Red-backed Shrike", family: "Törnskator" },
  { swedishName: "Varfågel", scientificName: "Lanius excubitor", englishName: "Great Grey Shrike", family: "Törnskator" },
  { swedishName: "Sånglärka", scientificName: "Alauda arvensis", englishName: "Eurasian Skylark", family: "Lärkor" },
  { swedishName: "Trädlärka", scientificName: "Lullula arborea", englishName: "Woodlark", family: "Lärkor" },
  { swedishName: "Berglärka", scientificName: "Eremophila alpestris", englishName: "Horned Lark", family: "Lärkor" },
  { swedishName: "Hussvala", scientificName: "Delichon urbicum", englishName: "Common House Martin", family: "Svalor" },
  { swedishName: "Ladusvala", scientificName: "Hirundo rustica", englishName: "Barn Swallow", family: "Svalor" },
  { swedishName: "Backsvala", scientificName: "Riparia riparia", englishName: "Sand Martin", family: "Svalor" },
  { swedishName: "Sommargylling", scientificName: "Oriolus oriolus", englishName: "Eurasian Golden Oriole", family: "Gyllingar" },

  // Hackspettar (Woodpeckers)
  { swedishName: "Större hackspett", scientificName: "Dendrocopos major", englishName: "Great Spotted Woodpecker", family: "Hackspettar" },
  { swedishName: "Mindre hackspett", scientificName: "Dryobates minor", englishName: "Lesser Spotted Woodpecker", family: "Hackspettar" },
  { swedishName: "Spillkråka", scientificName: "Dryocopus martius", englishName: "Black Woodpecker", family: "Hackspettar" },
  { swedishName: "Gröngöling", scientificName: "Picus viridis", englishName: "European Green Woodpecker", family: "Hackspettar" },
  { swedishName: "Gråspett", scientificName: "Picus canus", englishName: "Grey-headed Woodpecker", family: "Hackspettar" },
  { swedishName: "Tretåig hackspett", scientificName: "Picoides tridactylus", englishName: "Eurasian Three-toed Woodpecker", family: "Hackspettar" },
  { swedishName: "Vitryggig hackspett", scientificName: "Dendrocopos leucotos", englishName: "White-backed Woodpecker", family: "Hackspettar" },
  { swedishName: "Mellanspett", scientificName: "Dendrocoptes medius", englishName: "Middle Spotted Woodpecker", family: "Hackspettar" },
  { swedishName: "Göktyta", scientificName: "Jynx torquilla", englishName: "Eurasian Wryneck", family: "Hackspettar" },

  // Rovfåglar (Birds of prey)
  { swedishName: "Ormvråk", scientificName: "Buteo buteo", englishName: "Common Buzzard", family: "Rovfåglar" },
  { swedishName: "Fjällvråk", scientificName: "Buteo lagopus", englishName: "Rough-legged Buzzard", family: "Rovfåglar" },
  { swedishName: "Bivråk", scientificName: "Pernis apivorus", englishName: "European Honey Buzzard", family: "Rovfåglar" },
  { swedishName: "Sparvhök", scientificName: "Accipiter nisus", englishName: "Eurasian Sparrowhawk", family: "Rovfåglar" },
  { swedishName: "Duvhök", scientificName: "Accipiter gentilis", englishName: "Northern Goshawk", family: "Rovfåglar" },
  { swedishName: "Havsörn", scientificName: "Haliaeetus albicilla", englishName: "White-tailed Eagle", family: "Rovfåglar" },
  { swedishName: "Kungsörn", scientificName: "Aquila chrysaetos", englishName: "Golden Eagle", family: "Rovfåglar" },
  { swedishName: "Brun kärrhök", scientificName: "Circus aeruginosus", englishName: "Western Marsh Harrier", family: "Rovfåglar" },
  { swedishName: "Blå kärrhök", scientificName: "Circus cyaneus", englishName: "Hen Harrier", family: "Rovfåglar" },
  { swedishName: "Ängshök", scientificName: "Circus pygargus", englishName: "Montagu's Harrier", family: "Rovfåglar" },
  { swedishName: "Röd glada", scientificName: "Milvus milvus", englishName: "Red Kite", family: "Rovfåglar" },
  { swedishName: "Brun glada", scientificName: "Milvus migrans", englishName: "Black Kite", family: "Rovfåglar" },
  { swedishName: "Fiskgjuse", scientificName: "Pandion haliaetus", englishName: "Western Osprey", family: "Rovfåglar" },
  { swedishName: "Tornfalk", scientificName: "Falco tinnunculus", englishName: "Common Kestrel", family: "Falkar" },
  { swedishName: "Pilgrimsfalk", scientificName: "Falco peregrinus", englishName: "Peregrine Falcon", family: "Falkar" },
  { swedishName: "Stenfalk", scientificName: "Falco columbarius", englishName: "Merlin", family: "Falkar" },
  { swedishName: "Lärkfalk", scientificName: "Falco subbuteo", englishName: "Eurasian Hobby", family: "Falkar" },
  { swedishName: "Jaktfalk", scientificName: "Falco rusticolus", englishName: "Gyrfalcon", family: "Falkar" },
  { swedishName: "Aftonfalk", scientificName: "Falco vespertinus", englishName: "Red-footed Falcon", family: "Falkar" },

  // Ugglor (Owls)
  { swedishName: "Kattuggla", scientificName: "Strix aluco", englishName: "Tawny Owl", family: "Ugglor" },
  { swedishName: "Slaguggla", scientificName: "Strix uralensis", englishName: "Ural Owl", family: "Ugglor" },
  { swedishName: "Lappuggla", scientificName: "Strix nebulosa", englishName: "Great Grey Owl", family: "Ugglor" },
  { swedishName: "Hornuggla", scientificName: "Asio otus", englishName: "Long-eared Owl", family: "Ugglor" },
  { swedishName: "Jorduggla", scientificName: "Asio flammeus", englishName: "Short-eared Owl", family: "Ugglor" },
  { swedishName: "Berguv", scientificName: "Bubo bubo", englishName: "Eurasian Eagle-Owl", family: "Ugglor" },
  { swedishName: "Fjälluggla", scientificName: "Bubo scandiacus", englishName: "Snowy Owl", family: "Ugglor" },
  { swedishName: "Pärluggla", scientificName: "Aegolius funereus", englishName: "Boreal Owl", family: "Ugglor" },
  { swedishName: "Sparvuggla", scientificName: "Glaucidium passerinum", englishName: "Eurasian Pygmy Owl", family: "Ugglor" },
  { swedishName: "Hökuggla", scientificName: "Surnia ulula", englishName: "Northern Hawk-Owl", family: "Ugglor" },

  // Hägrar (Herons)
  { swedishName: "Gråhäger", scientificName: "Ardea cinerea", englishName: "Grey Heron", family: "Hägrar" },
  { swedishName: "Ägretthäger", scientificName: "Ardea alba", englishName: "Great Egret", family: "Hägrar" },
  { swedishName: "Rördrom", scientificName: "Botaurus stellaris", englishName: "Eurasian Bittern", family: "Hägrar" },

  // Änder (Ducks)
  { swedishName: "Gräsand", scientificName: "Anas platyrhynchos", englishName: "Mallard", family: "Änder" },
  { swedishName: "Kricka", scientificName: "Anas crecca", englishName: "Eurasian Teal", family: "Änder" },
  { swedishName: "Bläsand", scientificName: "Mareca penelope", englishName: "Eurasian Wigeon", family: "Änder" },
  { swedishName: "Stjärtand", scientificName: "Anas acuta", englishName: "Northern Pintail", family: "Änder" },
  { swedishName: "Årta", scientificName: "Spatula querquedula", englishName: "Garganey", family: "Änder" },
  { swedishName: "Skedand", scientificName: "Spatula clypeata", englishName: "Northern Shoveler", family: "Änder" },
  { swedishName: "Brunand", scientificName: "Aythya ferina", englishName: "Common Pochard", family: "Änder" },
  { swedishName: "Vigg", scientificName: "Aythya fuligula", englishName: "Tufted Duck", family: "Änder" },
  { swedishName: "Bergand", scientificName: "Aythya marila", englishName: "Greater Scaup", family: "Änder" },
  { swedishName: "Ejder", scientificName: "Somateria mollissima", englishName: "Common Eider", family: "Änder" },
  { swedishName: "Praktejder", scientificName: "Somateria spectabilis", englishName: "King Eider", family: "Änder" },
  { swedishName: "Alfågel", scientificName: "Clangula hyemalis", englishName: "Long-tailed Duck", family: "Änder" },
  { swedishName: "Sjöorre", scientificName: "Melanitta nigra", englishName: "Common Scoter", family: "Änder" },
  { swedishName: "Svärta", scientificName: "Melanitta fusca", englishName: "Velvet Scoter", family: "Änder" },
  { swedishName: "Knipa", scientificName: "Bucephala clangula", englishName: "Common Goldeneye", family: "Änder" },
  { swedishName: "Salskrake", scientificName: "Mergellus albellus", englishName: "Smew", family: "Änder" },
  { swedishName: "Småskrake", scientificName: "Mergus serrator", englishName: "Red-breasted Merganser", family: "Änder" },
  { swedishName: "Storskrake", scientificName: "Mergus merganser", englishName: "Common Merganser", family: "Änder" },

  // Svanar & gäss (Swans & geese)
  { swedishName: "Knölsvan", scientificName: "Cygnus olor", englishName: "Mute Swan", family: "Svanar" },
  { swedishName: "Sångsvan", scientificName: "Cygnus cygnus", englishName: "Whooper Swan", family: "Svanar" },
  { swedishName: "Mindre sångsvan", scientificName: "Cygnus columbianus", englishName: "Tundra Swan", family: "Svanar" },
  { swedishName: "Grågås", scientificName: "Anser anser", englishName: "Greylag Goose", family: "Gäss" },
  { swedishName: "Sädgås", scientificName: "Anser fabalis", englishName: "Bean Goose", family: "Gäss" },
  { swedishName: "Bläsgås", scientificName: "Anser albifrons", englishName: "Greater White-fronted Goose", family: "Gäss" },
  { swedishName: "Spetsbergsgås", scientificName: "Anser brachyrhynchus", englishName: "Pink-footed Goose", family: "Gäss" },
  { swedishName: "Fjällgås", scientificName: "Anser erythropus", englishName: "Lesser White-fronted Goose", family: "Gäss" },
  { swedishName: "Kanadagås", scientificName: "Branta canadensis", englishName: "Canada Goose", family: "Gäss" },
  { swedishName: "Vitkindad gås", scientificName: "Branta leucopsis", englishName: "Barnacle Goose", family: "Gäss" },
  { swedishName: "Prutgås", scientificName: "Branta bernicla", englishName: "Brent Goose", family: "Gäss" },
  { swedishName: "Nilgås", scientificName: "Alopochen aegyptiaca", englishName: "Egyptian Goose", family: "Gäss" },

  // Måsfåglar (Gulls & terns)
  { swedishName: "Fiskmås", scientificName: "Larus canus", englishName: "Common Gull", family: "Måsfåglar" },
  { swedishName: "Skrattmås", scientificName: "Chroicocephalus ridibundus", englishName: "Black-headed Gull", family: "Måsfåglar" },
  { swedishName: "Havstrut", scientificName: "Larus marinus", englishName: "Great Black-backed Gull", family: "Måsfåglar" },
  { swedishName: "Gråtrut", scientificName: "Larus argentatus", englishName: "European Herring Gull", family: "Måsfåglar" },
  { swedishName: "Silltrut", scientificName: "Larus fuscus", englishName: "Lesser Black-backed Gull", family: "Måsfåglar" },
  { swedishName: "Tretåig mås", scientificName: "Rissa tridactyla", englishName: "Black-legged Kittiwake", family: "Måsfåglar" },
  { swedishName: "Dvärgmås", scientificName: "Hydrocoloeus minutus", englishName: "Little Gull", family: "Måsfåglar" },
  { swedishName: "Fisktärna", scientificName: "Sterna hirundo", englishName: "Common Tern", family: "Tärnor" },
  { swedishName: "Silvertärna", scientificName: "Sterna paradisaea", englishName: "Arctic Tern", family: "Tärnor" },
  { swedishName: "Skräntärna", scientificName: "Hydroprogne caspia", englishName: "Caspian Tern", family: "Tärnor" },
  { swedishName: "Kentsk tärna", scientificName: "Thalasseus sandvicensis", englishName: "Sandwich Tern", family: "Tärnor" },
  { swedishName: "Småtärna", scientificName: "Sternula albifrons", englishName: "Little Tern", family: "Tärnor" },
  { swedishName: "Svarttärna", scientificName: "Chlidonias niger", englishName: "Black Tern", family: "Tärnor" },

  // Labbar (Skuas)
  { swedishName: "Fjällabb", scientificName: "Stercorarius longicaudus", englishName: "Long-tailed Jaeger", family: "Labbar" },
  { swedishName: "Kustlabb", scientificName: "Stercorarius parasiticus", englishName: "Arctic Skua", family: "Labbar" },
  { swedishName: "Storlabb", scientificName: "Stercorarius skua", englishName: "Great Skua", family: "Labbar" },
  { swedishName: "Bredstjärtad labb", scientificName: "Stercorarius pomarinus", englishName: "Pomarine Jaeger", family: "Labbar" },

  // Vadare (Waders)
  { swedishName: "Strandskata", scientificName: "Haematopus ostralegus", englishName: "Eurasian Oystercatcher", family: "Vadare" },
  { swedishName: "Tofsvipa", scientificName: "Vanellus vanellus", englishName: "Northern Lapwing", family: "Vadare" },
  { swedishName: "Ljungpipare", scientificName: "Pluvialis apricaria", englishName: "European Golden Plover", family: "Vadare" },
  { swedishName: "Kustpipare", scientificName: "Pluvialis squatarola", englishName: "Grey Plover", family: "Vadare" },
  { swedishName: "Större strandpipare", scientificName: "Charadrius hiaticula", englishName: "Common Ringed Plover", family: "Vadare" },
  { swedishName: "Mindre strandpipare", scientificName: "Charadrius dubius", englishName: "Little Ringed Plover", family: "Vadare" },
  { swedishName: "Enkelbeckasin", scientificName: "Gallinago gallinago", englishName: "Common Snipe", family: "Vadare" },
  { swedishName: "Dubbelbeckasin", scientificName: "Gallinago media", englishName: "Great Snipe", family: "Vadare" },
  { swedishName: "Morkulla", scientificName: "Scolopax rusticola", englishName: "Eurasian Woodcock", family: "Vadare" },
  { swedishName: "Storspov", scientificName: "Numenius arquata", englishName: "Eurasian Curlew", family: "Vadare" },
  { swedishName: "Småspov", scientificName: "Numenius phaeopus", englishName: "Eurasian Whimbrel", family: "Vadare" },
  { swedishName: "Rödspov", scientificName: "Limosa limosa", englishName: "Black-tailed Godwit", family: "Vadare" },
  { swedishName: "Myrspov", scientificName: "Limosa lapponica", englishName: "Bar-tailed Godwit", family: "Vadare" },
  { swedishName: "Rödbena", scientificName: "Tringa totanus", englishName: "Common Redshank", family: "Vadare" },
  { swedishName: "Skogssnäppa", scientificName: "Tringa ochropus", englishName: "Green Sandpiper", family: "Vadare" },
  { swedishName: "Grönbena", scientificName: "Tringa glareola", englishName: "Wood Sandpiper", family: "Vadare" },
  { swedishName: "Gluttsnäppa", scientificName: "Tringa nebularia", englishName: "Common Greenshank", family: "Vadare" },
  { swedishName: "Drillsnäppa", scientificName: "Actitis hypoleucos", englishName: "Common Sandpiper", family: "Vadare" },
  { swedishName: "Brushane", scientificName: "Calidris pugnax", englishName: "Ruff", family: "Vadare" },
  { swedishName: "Kärrsnäppa", scientificName: "Calidris alpina", englishName: "Dunlin", family: "Vadare" },
  { swedishName: "Sandlöpare", scientificName: "Calidris alba", englishName: "Sanderling", family: "Vadare" },
  { swedishName: "Mosnäppa", scientificName: "Calidris temminckii", englishName: "Temminck's Stint", family: "Vadare" },
  { swedishName: "Småsnäppa", scientificName: "Calidris minuta", englishName: "Little Stint", family: "Vadare" },
  { swedishName: "Skärfläcka", scientificName: "Recurvirostra avosetta", englishName: "Pied Avocet", family: "Vadare" },
  { swedishName: "Gulbena", scientificName: "Tringa flavipes", englishName: "Lesser Yellowlegs", family: "Vadare" },
  { swedishName: "Roskarl", scientificName: "Arenaria interpres", englishName: "Ruddy Turnstone", family: "Vadare" },
  { swedishName: "Svartsnäppa", scientificName: "Tringa erythropus", englishName: "Spotted Redshank", family: "Vadare" },
  { swedishName: "Fjällpipare", scientificName: "Eudromias morinellus", englishName: "Eurasian Dotterel", family: "Vadare" },

  // Rallar (Rails)
  { swedishName: "Sothöna", scientificName: "Fulica atra", englishName: "Eurasian Coot", family: "Rallar" },
  { swedishName: "Rörhöna", scientificName: "Gallinula chloropus", englishName: "Common Moorhen", family: "Rallar" },
  { swedishName: "Vattenrall", scientificName: "Rallus aquaticus", englishName: "Water Rail", family: "Rallar" },
  { swedishName: "Kornknarr", scientificName: "Crex crex", englishName: "Corncrake", family: "Rallar" },
  { swedishName: "Småfläckig sumphöna", scientificName: "Zapornia parva", englishName: "Little Crake", family: "Rallar" },

  // Tranor (Cranes)
  { swedishName: "Trana", scientificName: "Grus grus", englishName: "Common Crane", family: "Tranor" },

  // Storkar (Storks)
  { swedishName: "Vit stork", scientificName: "Ciconia ciconia", englishName: "White Stork", family: "Storkar" },
  { swedishName: "Svart stork", scientificName: "Ciconia nigra", englishName: "Black Stork", family: "Storkar" },

  // Duvor (Pigeons & doves)
  { swedishName: "Ringduva", scientificName: "Columba palumbus", englishName: "Common Wood Pigeon", family: "Duvor" },
  { swedishName: "Skogsduva", scientificName: "Columba oenas", englishName: "Stock Dove", family: "Duvor" },
  { swedishName: "Tamduva", scientificName: "Columba livia", englishName: "Rock Dove", family: "Duvor" },
  { swedishName: "Turkduva", scientificName: "Streptopelia decaocto", englishName: "Eurasian Collared Dove", family: "Duvor" },
  { swedishName: "Turturduva", scientificName: "Streptopelia turtur", englishName: "European Turtle Dove", family: "Duvor" },

  // Hönsfåglar (Gamebirds)
  { swedishName: "Fasan", scientificName: "Phasianus colchicus", englishName: "Common Pheasant", family: "Hönsfåglar" },
  { swedishName: "Orre", scientificName: "Lyrurus tetrix", englishName: "Black Grouse", family: "Hönsfåglar" },
  { swedishName: "Tjäder", scientificName: "Tetrao urogallus", englishName: "Western Capercaillie", family: "Hönsfåglar" },
  { swedishName: "Dalripa", scientificName: "Lagopus muta", englishName: "Rock Ptarmigan", family: "Hönsfåglar" },
  { swedishName: "Fjällripa", scientificName: "Lagopus lagopus", englishName: "Willow Ptarmigan", family: "Hönsfåglar" },
  { swedishName: "Järpe", scientificName: "Tetrastes bonasia", englishName: "Hazel Grouse", family: "Hönsfåglar" },
  { swedishName: "Rapphöna", scientificName: "Perdix perdix", englishName: "Grey Partridge", family: "Hönsfåglar" },
  { swedishName: "Vaktel", scientificName: "Coturnix coturnix", englishName: "Common Quail", family: "Hönsfåglar" },

  // Lommar (Divers/Loons)
  { swedishName: "Storlom", scientificName: "Gavia arctica", englishName: "Arctic Loon", family: "Lommar" },
  { swedishName: "Smålom", scientificName: "Gavia stellata", englishName: "Red-throated Loon", family: "Lommar" },
  { swedishName: "Islom", scientificName: "Gavia immer", englishName: "Common Loon", family: "Lommar" },

  // Doppingar (Grebes)
  { swedishName: "Skäggdopping", scientificName: "Podiceps cristatus", englishName: "Great Crested Grebe", family: "Doppingar" },
  { swedishName: "Gråhakedopping", scientificName: "Podiceps grisegena", englishName: "Red-necked Grebe", family: "Doppingar" },
  { swedishName: "Svarthalsad dopping", scientificName: "Podiceps nigricollis", englishName: "Black-necked Grebe", family: "Doppingar" },
  { swedishName: "Smådopping", scientificName: "Tachybaptus ruficollis", englishName: "Little Grebe", family: "Doppingar" },

  // Skarvar (Cormorants)
  { swedishName: "Storskarv", scientificName: "Phalacrocorax carbo", englishName: "Great Cormorant", family: "Skarvar" },
  { swedishName: "Toppskarv", scientificName: "Gulosus aristotelis", englishName: "European Shag", family: "Skarvar" },

  // Alkor (Auks)
  { swedishName: "Sillgrissla", scientificName: "Uria aalge", englishName: "Common Murre", family: "Alkor" },
  { swedishName: "Tordmule", scientificName: "Alca torda", englishName: "Razorbill", family: "Alkor" },
  { swedishName: "Tobisgrissla", scientificName: "Cepphus grylle", englishName: "Black Guillemot", family: "Alkor" },
  { swedishName: "Lunnefågel", scientificName: "Fratercula arctica", englishName: "Atlantic Puffin", family: "Alkor" },

  // Gök (Cuckoo)
  { swedishName: "Gök", scientificName: "Cuculus canorus", englishName: "Common Cuckoo", family: "Gökar" },

  // Nattskärra (Nightjar)
  { swedishName: "Nattskärra", scientificName: "Caprimulgus europaeus", englishName: "European Nightjar", family: "Nattskärror" },

  // Tornseglare (Swift)
  { swedishName: "Tornseglare", scientificName: "Apus apus", englishName: "Common Swift", family: "Seglare" },

  // Kungsfiskare (Kingfisher)
  { swedishName: "Kungsfiskare", scientificName: "Alcedo atthis", englishName: "Common Kingfisher", family: "Kungsfiskare" },

  // Biätare (Bee-eater)
  { swedishName: "Biätare", scientificName: "Merops apiaster", englishName: "European Bee-eater", family: "Biätare" },

  // Härfågel (Hoopoe)
  { swedishName: "Härfågel", scientificName: "Upupa epops", englishName: "Eurasian Hoopoe", family: "Härfåglar" },
];

async function main() {
  console.log(`Upserting ${swedishBirds.length} Swedish bird species...`);

  let created = 0;
  let updated = 0;

  for (const bird of swedishBirds) {
    const existing = await prisma.species.findUnique({
      where: { scientificName: bird.scientificName },
    });

    await prisma.species.upsert({
      where: { scientificName: bird.scientificName },
      update: {
        swedishName: bird.swedishName,
        englishName: bird.englishName,
        family: bird.family,
      },
      create: bird,
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`Done! Created ${created} new species, updated ${updated} existing.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
