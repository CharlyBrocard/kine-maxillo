/**
 * Reprend le schéma esquissé dans PROJECT.md, avec un ajustement : la
 * lecture `appointments(from, to)` est placée sous Query (c'est une
 * lecture, pas une mutation) au lieu de Mutation où l'esquisse l'avait
 * listée à côté des mutations "authentifiées (kiné)".
 */
export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum DayOfWeek {
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
    SUNDAY
  }

  enum ExceptionType {
    CLOSED
    ADDED
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

  type AvailabilityRule {
    id: ID!
    dayOfWeek: DayOfWeek!
    startTime: Int!
    endTime: Int!
  }

  type AvailabilityException {
    id: ID!
    date: DateTime!
    type: ExceptionType!
    reason: String
    startTime: Int
    endTime: Int
  }

  type Appointment {
    id: ID!
    slotStart: DateTime!
    slotEnd: DateTime!
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
  création. Tant que l'envoi d'email (Brevo) n'est pas branché — voir
  étape 7 du PROJECT.md — ils servent aussi à tester confirmAppointment
  / cancelAppointment sans email réel.
  """
  type RequestAppointmentPayload {
    appointment: Appointment!
    confirmationToken: String!
    cancellationToken: String!
  }

  input RequestAppointmentInput {
    slotStart: DateTime!
    patientName: String!
    patientPhone: String!
    patientEmail: String!
    reason: String
  }

  input AvailabilityRuleInput {
    dayOfWeek: DayOfWeek!
    startTime: Int!
    endTime: Int!
  }

  input AvailabilityExceptionInput {
    date: DateTime!
    type: ExceptionType!
    reason: String
    startTime: Int
    endTime: Int
  }

  type Query {
    availableSlots(from: DateTime!, to: DateTime!): [Slot!]!

    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    appointments(from: DateTime!, to: DateTime!): [Appointment!]!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    availabilityRules: [AvailabilityRule!]!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    availabilityExceptions: [AvailabilityException!]!
  }

  type Mutation {
    requestAppointment(input: RequestAppointmentInput!): RequestAppointmentPayload!
    confirmAppointment(token: String!): AppointmentPayload!
    cancelAppointment(token: String!): AppointmentPayload!

    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    setAvailabilityRule(input: AvailabilityRuleInput!): AvailabilityRule!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    deleteAvailabilityRule(id: ID!): Boolean!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    addAvailabilityException(input: AvailabilityExceptionInput!): AvailabilityException!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    deleteAvailabilityException(id: ID!): Boolean!
    "Authentifié (mono-compte praticienne, NextAuth) — voir PROJECT.md."
    cancelAppointmentAsAdmin(id: ID!): Appointment!
  }
`;
