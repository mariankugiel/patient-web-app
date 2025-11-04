import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface MessageParticipant {
  id: number
  name: string
  role: string
  avatar?: string
  initials?: string
  supabase_user_id?: string  // Add Supabase UUID for loading avatars from Storage
}

interface MessageParticipantsState {
  participants: Record<number, MessageParticipant> // Key: user_id, Value: participant info
  currentConversationId: string | null
}

const initialState: MessageParticipantsState = {
  participants: {},
  currentConversationId: null,
}

const messageParticipantsSlice = createSlice({
  name: "messageParticipants",
  initialState,
  reducers: {
    setConversationParticipants: (
      state,
      action: PayloadAction<{
        conversationId: string
        participants: MessageParticipant[]
      }>
    ) => {
      const { conversationId, participants } = action.payload
      state.currentConversationId = conversationId
      
      // Clear existing participants for this conversation
      Object.keys(state.participants).forEach(key => {
        const userId = parseInt(key)
        if (state.participants[userId]) {
          delete state.participants[userId]
        }
      })
      
      // Add new participants
      participants.forEach(participant => {
        state.participants[participant.id] = participant
      })
    },
    addParticipant: (state, action: PayloadAction<MessageParticipant>) => {
      const participant = action.payload
      state.participants[participant.id] = participant
    },
    clearParticipants: (state) => {
      state.participants = {}
      state.currentConversationId = null
    },
  },
})

export const { setConversationParticipants, addParticipant, clearParticipants } = messageParticipantsSlice.actions
export default messageParticipantsSlice.reducer
