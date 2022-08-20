export interface CreateBookingInput {
  input: {
    id: string;
    source: string;
    checkIn: string;
    checkOut: string;
  };
}

export interface CreateBookingArgs {
  input: CreateBookingInput;
}
