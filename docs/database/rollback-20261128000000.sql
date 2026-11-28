-- Rollback for migration 20261128000000_conversations_and_messages.
-- Removes the chat tables. All conversations and messages are lost. Take a backup first.
DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Conversation";
DROP TYPE IF EXISTS "MessageStatus";
DROP TYPE IF EXISTS "ConversationKind";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261128000000_conversations_and_messages';
