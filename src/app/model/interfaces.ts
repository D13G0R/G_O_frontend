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
    photo: string;
    boss: number;
    workAt: number;
    createdAt: string;
    updatedAt: string;
}