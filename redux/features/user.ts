import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface UserState {
  id: string;
  name: string;
  email: string;
  generation_credits: number | null;
  itinerary_credits: number | null;
  token: string;
}

const initialState: UserState = {
  id: "",
  name: "",
  email: "",
  generation_credits: null,
  itinerary_credits: null,
  token: "",
};

export const isUserDataComplete = (user: UserState): boolean => {
  return (
    typeof user.id === "string" &&
    user.id.trim() !== "" &&
    typeof user.name === "string" &&
    user.name.trim() !== "" &&
    typeof user.email === "string" &&
    user.email.trim() !== "" &&
    typeof user.generation_credits === "number" &&
    user.generation_credits !== null &&
    typeof user.itinerary_credits === "number" &&
    user.itinerary_credits !== null &&
    typeof user.token === "string" &&
    user.token.trim() !== ""
  );
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.generation_credits = action.payload.generation_credits;
      state.itinerary_credits = action.payload.itinerary_credits;
      state.token = action.payload.token;
    },
    resetUser: (state) => {
      return { ...initialState };
    },
    decrementGenerationCredits: (state) => {
      state.generation_credits =
        state.generation_credits! - 1 < 0
          ? 0
          : (state.generation_credits! -= 1);
    },
    decrementItineraryCredits: (state) => {
      state.itinerary_credits =
        state.itinerary_credits! - 1 < 0 ? 0 : (state.itinerary_credits! -= 1);
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setUser,
  resetUser,
  decrementGenerationCredits,
  decrementItineraryCredits,
} = userSlice.actions;
export const selectUserData = (state: RootState) => state.user;

export default userSlice.reducer;
