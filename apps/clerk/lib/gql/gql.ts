/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AppointmentRowFields on Appointment {\n    id\n    status\n    canCancel\n    bookedByStaff\n    patient {\n      id\n      name\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AppointmentRowFieldsFragmentDoc,
    "\n  query Appointments($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 20, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentRowFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AppointmentsDocument,
    "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentRowFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CancelAppointmentDocument,
    "\n  query AuditLogs($after: String) {\n    auditLogs(first: 30, after: $after) {\n      edges {\n        node {\n          id\n          occurredAt\n          action\n          actorKind\n          actorName\n          patientName\n          subject\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AuditLogsDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": typeof types.LogoutDocument,
    "\n  fragment BillDetail on Bill {\n    id\n    status\n    totalAmount\n    canManage\n    billedAt\n    paidAt\n    refundedAt\n    items {\n      id\n      name\n      unitPrice\n      quantity\n      amount\n    }\n    appointment {\n      id\n      patient {\n        id\n        name\n      }\n      slot {\n        id\n        startsAt\n        doctor {\n          id\n          name\n        }\n        clinic {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.BillDetailFragmentDoc,
    "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      ...BillDetail\n    }\n    feeItems {\n      id\n      name\n      unitPrice\n    }\n  }\n": typeof types.BillDocument,
    "\n  mutation UpdateBillItems($billId: ID!, $items: [BillItemInput!]!) {\n    updateBillItems(billId: $billId, items: $items) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.UpdateBillItemsDocument,
    "\n  mutation ConfirmBill($billId: ID!) {\n    confirmBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.ConfirmBillDocument,
    "\n  mutation MarkBillPaid($billId: ID!) {\n    markBillPaid(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.MarkBillPaidDocument,
    "\n  mutation RefundBill($billId: ID!) {\n    refundBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.RefundBillDocument,
    "\n  query Dashboard($from: ISO8601Date!, $to: ISO8601Date!) {\n    dashboard(from: $from, to: $to) {\n      date\n      total\n      canceled\n      noShow\n      completed\n      revenue\n      doctor {\n        id\n        name\n      }\n    }\n  }\n": typeof types.DashboardDocument,
    "\n  query AvailableSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AvailableSlotsDocument,
    "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CloseSlotDocument,
    "\n  mutation BookAppointment($slotId: ID!, $patientEmail: String!) {\n    bookAppointment(slotId: $slotId, patientEmail: $patientEmail) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.BookAppointmentDocument,
    "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.RescheduleAppointmentDocument,
    "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CreateSlotsDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n      canViewAuditLogs\n      clinic {\n        id\n        name\n        doctors {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.MeDocument,
};
const documents: Documents = {
    "\n  fragment AppointmentRowFields on Appointment {\n    id\n    status\n    canCancel\n    bookedByStaff\n    patient {\n      id\n      name\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n    }\n  }\n": types.AppointmentRowFieldsFragmentDoc,
    "\n  query Appointments($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 20, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentRowFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AppointmentsDocument,
    "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentRowFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CancelAppointmentDocument,
    "\n  query AuditLogs($after: String) {\n    auditLogs(first: 30, after: $after) {\n      edges {\n        node {\n          id\n          occurredAt\n          action\n          actorKind\n          actorName\n          patientName\n          subject\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AuditLogsDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": types.LogoutDocument,
    "\n  fragment BillDetail on Bill {\n    id\n    status\n    totalAmount\n    canManage\n    billedAt\n    paidAt\n    refundedAt\n    items {\n      id\n      name\n      unitPrice\n      quantity\n      amount\n    }\n    appointment {\n      id\n      patient {\n        id\n        name\n      }\n      slot {\n        id\n        startsAt\n        doctor {\n          id\n          name\n        }\n        clinic {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.BillDetailFragmentDoc,
    "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      ...BillDetail\n    }\n    feeItems {\n      id\n      name\n      unitPrice\n    }\n  }\n": types.BillDocument,
    "\n  mutation UpdateBillItems($billId: ID!, $items: [BillItemInput!]!) {\n    updateBillItems(billId: $billId, items: $items) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.UpdateBillItemsDocument,
    "\n  mutation ConfirmBill($billId: ID!) {\n    confirmBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.ConfirmBillDocument,
    "\n  mutation MarkBillPaid($billId: ID!) {\n    markBillPaid(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.MarkBillPaidDocument,
    "\n  mutation RefundBill($billId: ID!) {\n    refundBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.RefundBillDocument,
    "\n  query Dashboard($from: ISO8601Date!, $to: ISO8601Date!) {\n    dashboard(from: $from, to: $to) {\n      date\n      total\n      canceled\n      noShow\n      completed\n      revenue\n      doctor {\n        id\n        name\n      }\n    }\n  }\n": types.DashboardDocument,
    "\n  query AvailableSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AvailableSlotsDocument,
    "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CloseSlotDocument,
    "\n  mutation BookAppointment($slotId: ID!, $patientEmail: String!) {\n    bookAppointment(slotId: $slotId, patientEmail: $patientEmail) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.BookAppointmentDocument,
    "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.RescheduleAppointmentDocument,
    "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CreateSlotsDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n      canViewAuditLogs\n      clinic {\n        id\n        name\n        doctors {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.MeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AppointmentRowFields on Appointment {\n    id\n    status\n    canCancel\n    bookedByStaff\n    patient {\n      id\n      name\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AppointmentRowFields on Appointment {\n    id\n    status\n    canCancel\n    bookedByStaff\n    patient {\n      id\n      name\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Appointments($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 20, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentRowFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Appointments($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 20, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentRowFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentRowFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentRowFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuditLogs($after: String) {\n    auditLogs(first: 30, after: $after) {\n      edges {\n        node {\n          id\n          occurredAt\n          action\n          actorKind\n          actorName\n          patientName\n          subject\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query AuditLogs($after: String) {\n    auditLogs(first: 30, after: $after) {\n      edges {\n        node {\n          id\n          occurredAt\n          action\n          actorKind\n          actorName\n          patientName\n          subject\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BillDetail on Bill {\n    id\n    status\n    totalAmount\n    canManage\n    billedAt\n    paidAt\n    refundedAt\n    items {\n      id\n      name\n      unitPrice\n      quantity\n      amount\n    }\n    appointment {\n      id\n      patient {\n        id\n        name\n      }\n      slot {\n        id\n        startsAt\n        doctor {\n          id\n          name\n        }\n        clinic {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment BillDetail on Bill {\n    id\n    status\n    totalAmount\n    canManage\n    billedAt\n    paidAt\n    refundedAt\n    items {\n      id\n      name\n      unitPrice\n      quantity\n      amount\n    }\n    appointment {\n      id\n      patient {\n        id\n        name\n      }\n      slot {\n        id\n        startsAt\n        doctor {\n          id\n          name\n        }\n        clinic {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      ...BillDetail\n    }\n    feeItems {\n      id\n      name\n      unitPrice\n    }\n  }\n"): (typeof documents)["\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      ...BillDetail\n    }\n    feeItems {\n      id\n      name\n      unitPrice\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateBillItems($billId: ID!, $items: [BillItemInput!]!) {\n    updateBillItems(billId: $billId, items: $items) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateBillItems($billId: ID!, $items: [BillItemInput!]!) {\n    updateBillItems(billId: $billId, items: $items) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmBill($billId: ID!) {\n    confirmBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ConfirmBill($billId: ID!) {\n    confirmBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkBillPaid($billId: ID!) {\n    markBillPaid(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation MarkBillPaid($billId: ID!) {\n    markBillPaid(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RefundBill($billId: ID!) {\n    refundBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RefundBill($billId: ID!) {\n    refundBill(billId: $billId) {\n      bill {\n        id\n        ...BillDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Dashboard($from: ISO8601Date!, $to: ISO8601Date!) {\n    dashboard(from: $from, to: $to) {\n      date\n      total\n      canceled\n      noShow\n      completed\n      revenue\n      doctor {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query Dashboard($from: ISO8601Date!, $to: ISO8601Date!) {\n    dashboard(from: $from, to: $to) {\n      date\n      total\n      canceled\n      noShow\n      completed\n      revenue\n      doctor {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query AvailableSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BookAppointment($slotId: ID!, $patientEmail: String!) {\n    bookAppointment(slotId: $slotId, patientEmail: $patientEmail) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation BookAppointment($slotId: ID!, $patientEmail: String!) {\n    bookAppointment(slotId: $slotId, patientEmail: $patientEmail) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      kind\n      name\n      canViewAuditLogs\n      clinic {\n        id\n        name\n        doctors {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      kind\n      name\n      canViewAuditLogs\n      clinic {\n        id\n        name\n        doctors {\n          id\n          name\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;