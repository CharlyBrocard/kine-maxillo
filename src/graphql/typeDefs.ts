export const typeDefs = /* GraphQL */ `
  scalar DateTime

  """
  Deux catégories de RDV, chacune avec sa propre disponibilité (voir
  "Décisions produit" dans PROJECT.md).
  """
  enum Category {
    MAXILLO_FACIAL
    PRESSOTHERAPIE
  }

  enum AppointmentStatus {
    PENDING
    CONFIRMED
    CANCELLED
    EXPIRED
  }

  type Slot {
    start: DateTime!
    end: DateTime!
  }

  """
  Créneau ouvert manuellement par la praticienne, sans récurrence — voir
  "Décisions produit" dans PROJECT.md.
  """
  type AvailableSlot {
    id: ID!
    start: DateTime!
    category: Category!
    "true si un RDV pending (non expiré) ou confirmed couvre déjà ce créneau."
    booked: Boolean!
  }

  type Appointment {
    id: ID!
    slotStart: DateTime!
    slotEnd: DateTime!
    category: Category!
    patientName: String!
    patientPhone: String!
    patientEmail: String!
    reason: String
    status: AppointmentStatus!
  }

  """
  cancellationToken est renvoyé ici (en plus de RequestAppointmentPayload)
  car l'écran de confirmation, atteint uniquement via confirmationToken,
  affiche aussi l'action d'annulation — voir "Annulation en self-service"
  dans PROJECT.md. Ne pas ajouter ces tokens au type Appointment lui-même :
  il est aussi renvoyé par la query \`appointments\` (authentifiée, mais
  pas de raison d'exposer les tokens patients à la praticienne non plus).
  """
  type AppointmentPayload {
    appointment: Appointment!
    cancellationToken: String!
  }

  """
  confirmationToken / cancellationToken ne sont renvoyés qu'ici, à la
  création. Tant que l'envoi d'email (Brevo) n'est pas branché, ils
  servent aussi à tester confirmAppointment / cancelAppointment sans
  email réel.
  """
  type RequestAppointmentPayload {
    appointment: Appointment!
    confirmationToken: String!
    cancellationToken: String!
  }

  input RequestAppointmentInput {
    slotStart: DateTime!
    category: Category!
    patientName: String!
    patientPhone: String!
    patientEmail: String!
    reason: String
  }

  input AddAvailableSlotInput {
    start: DateTime!
    category: Category!
  }

  type Query {
    availableSlots(category: Category!, from: DateTime!, to: DateTime!): [Slot!]!

    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    appointments(from: DateTime!, to: DateTime!): [Appointment!]!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    availableSlotEntries(from: DateTime!, to: DateTime!): [AvailableSlot!]!
  }

  type Mutation {
    requestAppointment(input: RequestAppointmentInput!): RequestAppointmentPayload!
    confirmAppointment(token: String!): AppointmentPayload!
    cancelAppointment(token: String!): AppointmentPayload!

    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    addAvailableSlot(input: AddAvailableSlotInput!): AvailableSlot!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    deleteAvailableSlot(id: ID!): Boolean!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    cancelAppointmentAsAdmin(id: ID!): Appointment!
  }
`;
