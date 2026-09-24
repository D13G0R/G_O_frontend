export interface Character {
    id: number;
    name: string;
    status: string;
    species: string;
}

export type CharactersResponse =
    {
        results: Character[]
    };

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