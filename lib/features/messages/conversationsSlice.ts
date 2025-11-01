import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Conversation } from '@/types/messages'

interface ConversationsState {
  conversations: Conversation[]
  unreadCount: number
  isLoading: boolean
  error: string | null
}

const initialState: ConversationsState = {
  conversations: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
}

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(conv => conv.id === action.payload.id)
      if (index !== -1) {
        state.conversations[index] = action.payload
      } else {
        state.conversations.push(action.payload)
      }
    },
    addNewMessage: (state, action: PayloadAction<{ conversationId: string; message: any }>) => {
      const { conversationId, message } = action.payload
      const conversation = state.conversations.find(conv => conv.id === conversationId)
      if (conversation) {
        conversation.lastMessage = message
        conversation.lastMessageTime = message.created_at
        conversation.unreadCount += 1
        state.unreadCount += 1
      }
    },
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(conv => conv.id === action.payload)
      if (conversation && conversation.unreadCount > 0) {
        state.unreadCount -= conversation.unreadCount
        conversation.unreadCount = 0
      }
    },
    clearConversations: (state) => {
      state.conversations = []
      state.unreadCount = 0
    }
  }
})

export const {
  setLoading,
  setError,
  setConversations,
  setUnreadCount,
  updateConversation,
  addNewMessage,
  markConversationAsRead,
  clearConversations
} = conversationsSlice.actions

export default conversationsSlice.reducer
