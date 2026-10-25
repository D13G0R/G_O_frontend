export interface Appointment {
    id: number;
    bussinessId: number;
    sessionId: string;
    customerPhone: string;
    customerName: string;
    applianceType: string;
    problemDescription: string;
    address: string;
    appointmentDate: string;
    appointmentTime: string;
    status:string;
    technicianId: number;
    paymentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    paymentAmount?: number | null;
    paymentMethod?: string | null;
    paymentObservation?: string | null;
    paymentSubmittedAt?: string | null;
    paymentReviewedAt?: string | null;
    hasPaymentEvidence?: boolean | null;
    createdAt: string;
    updateAt: string;

}
export interface AppointmentCreate {

  sessionId: string;
  customerPhone: string;
  customerName: string;
  applianceType: string;
  problemDescription: string;
  address: string;
  appointmentDate: string; // Formato "YYYY-MM-DD"
  appointmentTime: string; // Formato "HH:mm:ss" o "HH:mm"
  status: string;
  technicianId?: number;
}

export interface AppointmentUpdateInterface {
    customer_phone : string;
    customer_name: string;
    applianceType: string;
    problemDescription: string;
    address: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    technicianId: number;

}

export interface RegisterRequest {
    fullName:string;
    phoneNumber: string;
    email: string;
    idCard : string
    password?: string;
    businessName: string;
    businessPhoneNumber: string;
}

export interface LoginPayload {

    email: string;
    password: string;
}

export interface AuthInformation {
    
    phoneNumberId : string;
    businessId : number; // 'Long' se traduce como 'number'. Es opcional (?) porque el backend lo genera automáticamente.
    ownerName : string;
    email : string;
    businessName : string;
    user_id?: number;
    user_name?: string;
    sub?: string;
    role?: 'owner' | 'technician' | string;
    technician_id?: number | null;
}

export interface BusinessContext {

    businessId: number;
    phoneNumberId: string;
    email: string;
    password: string;
    businessName: string;
    fullOwnerName: string;
    isActive: boolean;
}

// Solo se envían los campos que se desean cambiar; los omitidos se conservan.
export interface BusinessConfigurationUpdate {
    services?: string[]; // Opcional porque en Java no tiene 'nullable = false', por lo que puede ser nulo.
    coverageAreas?: string[];
    workingHours?: Record<string, string>;
    businessRules?: string[];
    systemPrompt?: string;
    maxParallelAppointments?: number;
}

export interface TechnicianInterface {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    idCard: string;
    photo: string | null;
    bossId?: number | null;
    businessId?: number | null;
    userId?: number | null;
    active?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterTechnicianRequest {
    fullName: string;
    phoneNumber: string;
    email: string;
    idCard: string;
    photo?: string | null;
    password: string;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PaymentReview {
    id: number;
    appointmentId: number;
    businessId: number;
    technicianId: number;
    technicianName: string;
    technicianPhone: string;
    customerName: string;
    customerPhone: string;
    address: string;
    service: string;
    problemDescription: string;
    appointmentDate: string;
    appointmentTime: string;
    amount: number;
    method: string;
    reference: string | null;
    status: PaymentStatus;
    observation: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    reviewedByName: string | null;
    evidenceAvailable: boolean;
    evidenceContentType: string;
    evidenceUrl: string;
}

export interface PaymentDecision {
    status: 'APPROVED' | 'REJECTED';
    observation?: string | null;
}

export interface PaymentEvent {
    type: 'PAYMENT_SUBMITTED' | 'PAYMENT_REVIEWED';
    payment: PaymentReview;
}