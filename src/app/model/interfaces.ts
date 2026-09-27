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

export interface UserPayload {
    // 'Long' se traduce como 'number'. Es opcional (?) porque el backend lo genera automáticamente.
    businessName: string;
    ownerName: string;        // Opcional porque en Java no tiene 'nullable = false', por lo que puede ser nulo.
    phoneNumberId: string;
    email: string;             // Se maneja como un string plano en el frontend.
    password?: string;         // Opcional por seguridad (muchas veces el backend no lo devuelve al consultar).
}

export interface LoginPayload {

    phoneNumber: string;
    password: string;
}

export interface AuthInformation {
    
    phoneNumberId : string;
    businessId : number;
    ownerName : string;
    email : string;
    businessName : string;
}