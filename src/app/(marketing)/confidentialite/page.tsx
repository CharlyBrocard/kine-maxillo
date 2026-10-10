import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { siteConfig } from "@/lib/site-config";
import {
  APPOINTMENT_RETENTION_DAYS,
  PENDING_HOLD_MINUTES,
  REASON_RETENTION_DAYS,
  UNCONFIRMED_RETENTION_DAYS,
} from "@/lib/booking-constants";

/**
 * Politique de confidentialité. Décrit ce que fait réellement
 * l'application — à mettre à jour si le traitement change (nouveau
 * prestataire, nouvelle donnée, durée de conservation…). Les durées sont
 * lues dans booking-constants.ts pour rester alignées avec la purge.
 */
export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Données collectées lors de la prise de rendez-vous, durées de conservation, destinataires et droits — cabinet de ${siteConfig.praticienne}, ${siteConfig.ville}.`,
  alternates: { canonical: "/confidentialite" },
};

const LAST_UPDATE = "10 octobre 2026";
const BACKUP_RETENTION_DAYS = 14;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="flex flex-col gap-2 text-[16.5px] leading-relaxed text-body">{children}</div>
    </div>
  );
}

function Row({ what, duration }: { what: string; duration: string }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2.5 pr-4 align-top">{what}</td>
      <td className="py-2.5 align-top text-ink">{duration}</td>
    </tr>
  );
}

export default function ConfidentialitePage() {
  const months = Math.round(APPOINTMENT_RETENTION_DAYS / 30.4);
  return (
    <div className="flex flex-col">
      <Header />

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              Politique de confidentialité
            </h1>
            <p className="text-[16.5px] leading-relaxed text-body">
              Cette page explique quelles données sont collectées lorsque vous
              utilisez ce site, notamment pour prendre rendez-vous, pourquoi,
              combien de temps elles sont conservées et comment exercer vos
              droits. Dernière mise à jour : {LAST_UPDATE}.
            </p>
          </div>

          <Section title="Responsable du traitement">
            <p>
              {siteConfig.praticienne}, {siteConfig.qualification} —{" "}
              {siteConfig.adresseLigne1}, {siteConfig.adresseLigne2}.
            </p>
            <p>
              Contact pour toute question sur vos données :{" "}
              <a href={`mailto:${siteConfig.email}`} className="underline underline-offset-4">
                {siteConfig.email}
              </a>{" "}
              ou {siteConfig.telephone}.
            </p>
          </Section>

          <Section title="Données collectées">
            <p>
              <strong className="text-ink">Lors d&apos;une prise de rendez-vous :</strong>{" "}
              nom et prénom, téléphone, adresse email, type de rendez-vous, date
              et heure choisies, et le motif de consultation (choisi dans une
              liste, avec une précision libre facultative).
            </p>
            <p>
              Le motif de consultation peut révéler des informations sur votre
              santé : il est traité avec une protection renforcée (voir plus
              bas). Ne renseignez que ce qui est utile pour préparer la séance.
            </p>
            <p>
              <strong className="text-ink">Simple consultation du site :</strong>{" "}
              aucune donnée personnelle n&apos;est demandée. Comme tout site web,
              le serveur reçoit techniquement votre adresse IP, utilisée pour
              la sécurité (protection contre les abus et les tentatives
              d&apos;intrusion) et conservée brièvement (voir les durées
              ci-dessous).
            </p>
            <p>
              Si vous prenez rendez-vous pour un enfant ou une personne dont
              vous êtes le représentant légal, c&apos;est vous qui renseignez et
              recevez les informations du rendez-vous.
            </p>
          </Section>

          <Section title="Pourquoi et sur quelle base">
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong className="text-ink">Gérer votre rendez-vous</strong>{" "}
                (le confirmer, vous envoyer le récapitulatif, permettre son
                annulation, prévenir la praticienne) : traitement nécessaire à
                la prise de rendez-vous que vous demandez (article 6.1.b du
                RGPD).
              </li>
              <li>
                <strong className="text-ink">Préparer la séance à partir du motif</strong>{" "}
                : donnée de santé traitée par une professionnelle de santé
                soumise au secret professionnel, pour la prise en charge que vous
                sollicitez (article 9.2.h du RGPD).
              </li>
              <li>
                <strong className="text-ink">Sécuriser le site</strong> (limiter
                les demandes abusives et les tentatives de connexion répétées)
                : intérêt légitime à protéger le service et vos données (article
                6.1.f du RGPD).
              </li>
            </ul>
            <p>
              Vos données ne sont ni vendues, ni louées, ni utilisées à des fins
              commerciales ou publicitaires.
            </p>
          </Section>

          <Section title="Durées de conservation">
            <p>
              Les données sont supprimées automatiquement au terme de ces
              durées :
            </p>
            <table className="w-full text-left text-[15.5px]">
              <tbody>
                <Row
                  what="Demande de rendez-vous non confirmée par email"
                  duration={`Créneau libéré après ${PENDING_HOLD_MINUTES} minutes, données supprimées ${UNCONFIRMED_RETENTION_DAYS} jours après la demande`}
                />
                <Row
                  what="Motif de consultation (sur le site)"
                  duration={`Effacé dès l'annulation, sinon ${REASON_RETENTION_DAYS} jours après le rendez-vous`}
                />
                <Row
                  what="Rendez-vous (nom, téléphone, email, date)"
                  duration={`${months} mois après la date du rendez-vous`}
                />
                <Row
                  what="Sauvegardes de la base de données"
                  duration={`${BACKUP_RETENTION_DAYS} jours (une donnée supprimée peut y subsister jusqu'à cette durée)`}
                />
                <Row
                  what="Journaux techniques du serveur (adresse IP)"
                  duration="14 jours, puis suppression automatique"
                />
              </tbody>
            </table>
            <p>
              Ce site sert uniquement à la prise de rendez-vous : votre dossier
              de soins, s&apos;il est constitué, est tenu séparément par la
              praticienne, selon les règles applicables aux professionnels de
              santé.
            </p>
          </Section>

          <Section title="Qui a accès à vos données">
            <p>
              Seule la praticienne a accès à vos rendez-vous, via un espace
              protégé par mot de passe. Elle reçoit aussi une notification
              par email pour chaque nouveau rendez-vous, avec vos coordonnées
              et le motif de consultation : cette copie est conservée dans sa
              messagerie professionnelle, sous sa responsabilité, et
              n&apos;est pas concernée par l&apos;effacement automatique du
              site. Pour faire fonctionner le site, elle
              fait appel aux prestataires suivants, qui n&apos;utilisent pas vos
              données pour leur propre compte :
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong className="text-ink">Hébergement du site et de la base de données</strong>{" "}
                : serveur privé loué par la praticienne auprès de{" "}
                {siteConfig.hebergeur.nom}, situé en{" "}
                {siteConfig.hebergeur.localisationServeur} — vos données restent
                dans l&apos;Union européenne (voir les{" "}
                <Link href="/mentions-legales" className="underline underline-offset-4">
                  mentions légales
                </Link>
                ).
              </li>
              <li>
                <strong className="text-ink">Brevo</strong> (société française)
                : envoi des emails de rendez-vous. Brevo reçoit votre nom, votre
                email et les informations du rendez-vous. Le motif de
                consultation n&apos;est transmis que dans l&apos;email de
                notification adressé à la praticienne, jamais dans les emails
                qui vous sont envoyés.
              </li>
              <li>
                <strong className="text-ink">OpenStreetMap</strong> : la carte de
                la page Contact est chargée depuis les serveurs de la fondation
                OpenStreetMap (Royaume-Uni, pays reconnu par l&apos;Union
                européenne comme offrant une protection adéquate), qui reçoivent
                votre adresse IP à l&apos;affichage de la carte.
              </li>
            </ul>
            <p>
              Si vous choisissez d&apos;ajouter le rendez-vous à votre agenda
              (lien Google Agenda ou fichier joint à l&apos;email), les
              informations du rendez-vous sont alors enregistrées par le
              service d&apos;agenda que vous utilisez, selon ses propres
              conditions.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Ce site n&apos;utilise ni cookie publicitaire, ni outil de mesure
              d&apos;audience, ni bouton de réseau social : aucun bandeau de
              consentement n&apos;est donc nécessaire. Les polices de caractères
              sont hébergées sur le site lui-même.
            </p>
            <p>
              Le seul cookie utilisé est celui de la session de l&apos;espace
              praticienne, strictement nécessaire à la connexion de la
              praticienne : il n&apos;est jamais déposé lors de la consultation
              du site ou d&apos;une prise de rendez-vous.
            </p>
          </Section>

          <Section title="Sécurité">
            <p>
              Les échanges avec le site sont chiffrés (HTTPS). La base de
              données n&apos;est pas accessible depuis Internet, l&apos;espace
              praticienne est protégé par mot de passe avec blocage des
              tentatives répétées, et les liens de confirmation et
              d&apos;annulation envoyés par email sont uniques et impossibles à
              deviner.
            </p>
          </Section>

          <Section title="Vos droits">
            <p>
              Vous pouvez demander l&apos;accès à vos données, leur
              rectification, leur effacement, la limitation de leur traitement,
              vous opposer à leur traitement ou en demander la portabilité, en
              écrivant à{" "}
              <a href={`mailto:${siteConfig.email}`} className="underline underline-offset-4">
                {siteConfig.email}
              </a>
              . Une réponse vous sera apportée dans un délai d&apos;un mois.
            </p>
            <p>
              Vous pouvez à tout moment annuler un rendez-vous grâce au lien
              reçu par email, ce qui efface immédiatement le motif de
              consultation.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              adresser une réclamation à la CNIL (
              <a
                href="https://www.cnil.fr/fr/plaintes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                cnil.fr/fr/plaintes
              </a>
              ).
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}
