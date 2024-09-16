import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { FurnitureDetails } from "@/lib/types";

const llmModel = openai("gpt-4o-2024-08-06");

export async function generateFinalAnalysis(
  imageAnalysis: string,
  similarFurniture: any[],
  furnitureDetails: FurnitureDetails,
): Promise<string> {
  const furnitureContext = createFurnitureContext(similarFurniture);

  const finalAnalysisResult = await generateText({
    model: llmModel,
    system: `Olet tekoälyavustaja, joka on erikoistunut huonekalujen analysointiin ja hinnoitteluun. 
      Anna kattava analyysi analysoitavasta huonekalusta perustuen sinun tietoihisin huonekalujen hinnasta ja samankaltaisien huonekalujen hintoihin tietokannassamme.
      Muotoile vastauksesi seuraavien ohjeiden mukaisesti:
      1. Käytä pääotsikoissa '##' ja alaotsikoissa '###'.
      2. Käytä numeroituja listoja (1., 2., 3.) pääkohdille.
      3. Käytä luettelomerkkejä ('•') alakohdille tai yksityiskohdille.
      4. Korosta tärkeitä kohtia käyttämällä '**' lihavoitua tekstiä.
      5. Varmista yhtenäinen välistys osioiden välillä luettavuuden parantamiseksi.
      Käytä suomen kieltä vastauksessasi.`,
    messages: [
      {
        role: "user",
        content: `
          Analysoidun huonekalun tiedot:
          ${imageAnalysis}
          
          Samankaltaiset huonekalut tietokannasta:
          ${furnitureContext}
          
          Käyttäjän antamat tiedot:
          ${JSON.stringify(furnitureDetails, null, 2)}
        
        Anna kattava analyysi, joka sisältää seuraavat osiot ja ota huomioon, että huonekalu on suunniteltu myytäväksi tai käytettäväksi Suomen markkinoilla:
        ## Kattava analyysi analysoidusta huonekalusta
        ### 1. Yleiskuvaus ja erityispiirteet
        • Huonekalun tyyli, materiaali ja kunto
        • Mahdolliset uniikit tai arvokkaat ominaisuudet
        ### 2. Arvioitu hintahaarukka ja perustelut
        • Hinta-arvio ja sen perustelut
        • Vertailu samankaltaisiin tuotteisiin tietokannassa
        ### 3. Markkinatilanne ja vertailu
        • Analyysi nykyisistä markkinatrendeistä
        • Vertailu uusiin, vastaaviin tuotteisiin markkinoilla
        • Huonekalun kilpailukyky markkinoilla
        ### 4. Kierrätys- ja myyntiehdotukset
        • Konkreettiset ehdotukset kierrätykseen tai uusiokäyttöön
        • Vinkkejä huonekalun arvon maksimointiin myyntiä varten
        ### 5. Potentiaaliset ostajat ja käyttökohteet
        • Profiili ideaalisesta ostajasta
        • Ehdotuksia sopivista käyttökohteista tai sisustusyhdistelmistä
        ## Yhteenveto
        • Tiivistelmä tärkeimmistä havainnoista ja suosituksista
        • Loppuarvio huonekalun arvosta ja potentiaalista

        Varmista, että jokainen osio on selkeästi muotoiltu, sisältää konkreettisia esimerkkejä ja on helppolukuinen. Anna käytännöllisiä ja toimintaorientoituneita neuvoja, jotka ovat erityisen relevantteja Suomen markkinoilla. Ota huomioon suomalaisten kuluttajien mieltymykset, ostokäyttäytyminen ja paikalliset trendit analyysissäsi.
        `,
      },
    ],
  });

  return finalAnalysisResult.text;
}

function createFurnitureContext(similarFurniture: any[]): string {
  return similarFurniture
    .map((item: any) => {
      const metadata = item.metadata || {};
      return `
        Tyyppi: ${item.type || "Ei määritelty"}
        Merkki: ${item.brand || "Ei määritelty"}
        Materiaali: ${item.material || "Ei määritelty"}
        Kunto: ${item.condition || "Ei määritelty"}
        Hinta: ${item.price ? `${item.price}€` : "Ei määritelty"}
        Kuvaus: ${item.description || "Ei määritelty"}
        Tyyli: ${metadata.style || "Ei määritelty"}
        Käyttötarkoitus: ${metadata.usage || "Ei määritelty"}
        Ominaisuudet: ${Array.isArray(metadata.features) ? metadata.features.join(", ") : "Ei määritelty"}
        Mukavuustaso: ${metadata.comfortLevel || "Ei määritelty"}
        Sopivat huoneet: ${Array.isArray(metadata.suitableRooms) ? metadata.suitableRooms.join(", ") : "Ei määritelty"}
        Samankaltaisuus: ${(item.similarity * 100).toFixed(2)}%
      `;
    })
    .join("\n\n");
}
