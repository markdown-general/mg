# pi-mono: Full API Surface

A comprehensive map of all types, functions, and protocols in the pi-mono system. Organized as a reference for translating to Haskell or other languages.

---

## Layer 0: LLM Types (pi-ai)

**Source**: `packages/ai/src/types.ts`

### Core Message Types

```haskell
-- Role types
type Provider = Known Provider | String
type Api = Known Api | String

data TextContent = TextContent {
  text :: String,
  textSignature :: Maybe String
}

data ImageContent = ImageContent {
  data :: String,  -- base64
  mimeType :: String
}

data ThinkingContent = ThinkingContent {
  thinking :: String,
  thinkingSignature :: Maybe String
}

data ToolCall = ToolCall {
  id :: String,
  name :: String,
  arguments :: JSON,  -- Map String Value
  thoughtSignature :: Maybe String
}

-- Content = Text | Thinking | ToolCall | Image
data Content = TextC TextContent
             | ThinkingC ThinkingContent
             | ToolCallC ToolCall
             | ImageC ImageContent
```

### Message Types

```haskell
type Timestamp = Int64  -- Unix milliseconds

data UserMessage = UserMessage {
  role :: "user",
  content :: String | [TextContent | ImageContent],
  timestamp :: Timestamp
}

data Usage = Usage {
  input :: Int,
  output :: Int,
  cacheRead :: Int,
  cacheWrite :: Int,
  totalTokens :: Int,
  cost :: CostDetails
}

data CostDetails = CostDetails {
  input :: Float,
  output :: Float,
  cacheRead :: Float,
  cacheWrite :: Float,
  total :: Float
}

type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted"

data AssistantMessage = AssistantMessage {
  role :: "assistant",
  content :: [Content],  -- TextContent | ThinkingContent | ToolCall
  api :: Api,
  provider :: Provider,
  model :: String,
  usage :: Usage,
  stopReason :: StopReason,
  errorMessage :: Maybe String,
  timestamp :: Timestamp
}

data ToolResultMessage a = ToolResultMessage {
  role :: "toolResult",
  toolCallId :: String,
  toolName :: String,
  content :: [TextContent | ImageContent],
  details :: Maybe a,
  isError :: Bool,
  timestamp :: Timestamp
}

-- Unified message type
type Message = UserMessage | AssistantMessage | ToolResultMessage ()
```

### Streaming Events

```haskell
-- Assistant message events (delta stream during generation)
type AssistantMessageEvent
  = StartEvent AssistantMessage
  | TextStartEvent { contentIndex :: Int, partial :: AssistantMessage }
  | TextDeltaEvent { contentIndex :: Int, delta :: String, partial :: AssistantMessage }
  | TextEndEvent { contentIndex :: Int, content :: String, partial :: AssistantMessage }
  | ThinkingStartEvent { contentIndex :: Int, partial :: AssistantMessage }
  | ThinkingDeltaEvent { contentIndex :: Int, delta :: String, partial :: AssistantMessage }
  | ThinkingEndEvent { contentIndex :: Int, content :: String, partial :: AssistantMessage }
  | ToolcallStartEvent { contentIndex :: Int, partial :: AssistantMessage }
  | ToolcallDeltaEvent { contentIndex :: Int, delta :: String, partial :: AssistantMessage }
  | ToolcallEndEvent { contentIndex :: Int, toolCall :: ToolCall, partial :: AssistantMessage }
  | DoneEvent { reason :: StopReason, message :: AssistantMessage }
  | ErrorEvent { reason :: StopReason, error :: AssistantMessage }
```

### Model Metadata

```haskell
data Model = Model {
  id :: String,
  name :: String,
  api :: Api,
  provider :: Provider,
  baseUrl :: String,
  reasoning :: Bool,
  input :: [String],       -- "text", "image"
  contextWindow :: Int,
  maxTokens :: Int,
  cost :: CostDetails
}

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh"

data ThinkingBudgets = ThinkingBudgets {
  minimal :: Maybe Int,
  low :: Maybe Int,
  medium :: Maybe Int,
  high :: Maybe Int
}
```

### Tool Definition

```haskell
data Tool a = Tool {
  name :: String,
  description :: String,
  parameters :: JSONSchema  -- TypeBox schema
}

-- Context sent to LLM
data Context = Context {
  systemPrompt :: Maybe String,
  messages :: [Message],
  tools :: Maybe [Tool ()]
}
```

### Stream Options

```haskell
type CacheRetention = "none" | "short" | "long"
type Transport = "sse" | "websocket" | "auto"

data StreamOptions = StreamOptions {
  temperature :: Maybe Float,
  maxTokens :: Maybe Int,
  signal :: Maybe AbortSignal,
  apiKey :: Maybe String,
  transport :: Maybe Transport,
  cacheRetention :: Maybe CacheRetention,
  sessionId :: Maybe String,
  onPayload :: Maybe (JSON -> IO ()),
  headers :: Maybe (Map String String),
  maxRetryDelayMs :: Maybe Int,
  metadata :: Maybe (Map String Unknown)
}

data SimpleStreamOptions = SimpleStreamOptions {
  streamOptions :: StreamOptions,
  reasoning :: Maybe ThinkingLevel,
  thinkingBudgets :: Maybe ThinkingBudgets
}
```

---

## Layer 1: Agent Core (pi-agent)

**Source**: `packages/agent/src/types.ts`

### Agent State

```haskell
data AgentState = AgentState {
  systemPrompt :: String,
  model :: Model,
  thinkingLevel :: ThinkingLevel,
  tools :: [AgentTool],
  messages :: [AgentMessage],
  isStreaming :: Bool,
  streamMessage :: Maybe AgentMessage,
  pendingToolCalls :: Set String,
  error :: Maybe String
}

-- Custom messages can be injected by apps
-- This is extensible via declaration merging in TypeScript
data CustomAgentMessages = CustomAgentMessages {}

-- Agent messages = LLM messages + custom messages
type AgentMessage = Message | CustomAgentMessage
```

### Agent Tools

```haskell
type AgentToolResult a = AgentToolResult {
  content :: [TextContent | ImageContent],
  details :: a
}

-- Update callback during tool execution
type AgentToolUpdateCallback a = AgentToolResult a -> IO ()

data AgentTool a b = AgentTool {
  name :: String,
  description :: String,
  label :: String,
  parameters :: JSONSchema,  -- TypeBox schema
  execute :: String -> a -> Maybe AbortSignal -> Maybe (AgentToolUpdateCallback b) -> IO (AgentToolResult b)
}

-- AgentContext uses AgentTool
data AgentContext = AgentContext {
  systemPrompt :: String,
  messages :: [AgentMessage],
  tools :: Maybe [AgentTool]
}
```

### Agent Events

```haskell
type AgentEvent
  = AgentStartEvent
  | AgentEndEvent { messages :: [AgentMessage] }
  | TurnStartEvent
  | TurnEndEvent { message :: AgentMessage, toolResults :: [ToolResultMessage ()] }
  | MessageStartEvent { message :: AgentMessage }
  | MessageUpdateEvent { message :: AgentMessage, assistantMessageEvent :: AssistantMessageEvent }
  | MessageEndEvent { message :: AgentMessage }
  | ToolExecutionStartEvent { toolCallId :: String, toolName :: String, args :: JSON }
  | ToolExecutionUpdateEvent { toolCallId :: String, toolName :: String, args :: JSON, partialResult :: JSON }
  | ToolExecutionEndEvent { toolCallId :: String, toolName :: String, result :: JSON, isError :: Bool }
```

### Agent Loop Config

```haskell
data AgentLoopConfig = AgentLoopConfig {
  model :: Model,
  streamOptions :: SimpleStreamOptions,
  
  -- Convert AgentMessage[] to LLM-compatible Message[]
  convertToLlm :: [AgentMessage] -> IO [Message],
  
  -- Optional context transformation before convertToLlm
  transformContext :: Maybe ([AgentMessage] -> Maybe AbortSignal -> IO [AgentMessage]),
  
  -- Dynamic API key resolution per call
  getApiKey :: Maybe (String -> IO (Maybe String)),
  
  -- Steering: messages to inject mid-run (after tool execution)
  getSteeringMessages :: Maybe (IO [AgentMessage]),
  
  -- Follow-up: messages to process when agent would stop
  getFollowUpMessages :: Maybe (IO [AgentMessage])
}
```

---

## Layer 2: Session Management (pi-coding-agent)

**Source**: `packages/coding-agent/src/core/session-manager.ts` and `buff/session.md`

### Session Entry Types

```haskell
-- Tree structure
data SessionEntry
  = SessionHeader {
      id :: String,
      cwd :: String,
      parentSession :: Maybe String,
      version :: Int,
      timestamp :: Timestamp
    }
  | SessionMessageEntry {
      id :: String,
      parentId :: Maybe String,
      message :: Message,
      timestamp :: Timestamp
    }
  | ModelChangeEntry {
      id :: String,
      parentId :: Maybe String,
      provider :: Provider,
      modelId :: String,
      timestamp :: Timestamp
    }
  | ThinkingLevelChangeEntry {
      id :: String,
      parentId :: Maybe String,
      thinkingLevel :: ThinkingLevel,
      timestamp :: Timestamp
    }
  | SessionInfoEntry {
      id :: String,
      parentId :: Maybe String,
      name :: String,
      timestamp :: Timestamp
    }
  | LabelEntry {
      id :: String,
      parentId :: Maybe String,
      targetId :: String,
      label :: String,
      timestamp :: Timestamp
    }
  | BranchSummaryEntry {
      id :: String,
      parentId :: Maybe String,
      fromId :: String,
      summary :: String,
      fromHook :: Bool,
      details :: Maybe JSON,
      timestamp :: Timestamp
    }
  | CompactionEntry {
      id :: String,
      parentId :: Maybe String,
      summary :: String,
      firstKeptEntryId :: String,
      tokensBefore :: Int,
      details :: Maybe JSON,
      fromHook :: Bool,
      timestamp :: Timestamp
    }
  | CustomEntry {
      id :: String,
      parentId :: Maybe String,
      customType :: String,
      data :: Maybe JSON,
      timestamp :: Timestamp
    }
  | CustomMessageEntry {
      id :: String,
      parentId :: Maybe String,
      customType :: String,
      content :: String | [TextContent | ImageContent],
      details :: Maybe JSON,
      display :: Bool,
      timestamp :: Timestamp
    }
```

### Session Manager API

```haskell
data SessionManager = SessionManager {
  -- Read & Navigate
  getSessionId :: () -> String,
  getSessionFile :: () -> Maybe String,
  getCwd :: () -> String,
  getHeader :: () -> Maybe SessionHeader,
  getSessionName :: () -> Maybe String,
  getLeafId :: () -> Maybe String,
  getLeafEntry :: () -> Maybe SessionEntry,
  
  -- Query
  getEntry :: String -> Maybe SessionEntry,
  getChildren :: String -> [SessionEntry],
  getBranch :: Maybe String -> [SessionEntry],  -- Path from root
  getTree :: () -> [SessionTreeNode],
  getLabel :: String -> Maybe String,
  getEntries :: () -> [SessionEntry],
  
  -- LLM context
  getSessionContext :: () -> SessionContext,
  
  -- Append operations
  appendMessage :: Message -> IO String,
  appendThinkingLevelChange :: ThinkingLevel -> IO String,
  appendModelChange :: Provider -> String -> IO String,
  appendSessionInfo :: String -> IO String,
  appendLabelChange :: String -> Maybe String -> IO String,
  appendCustomEntry :: String -> Maybe JSON -> IO String,
  appendCustomMessageEntry :: String -> (String | [TextContent | ImageContent]) -> Bool -> Maybe JSON -> IO String,
  appendCompaction :: String -> String -> Int -> Maybe JSON -> Maybe Bool -> IO String,
  
  -- Branching
  branch :: String -> IO (),
  branchWithSummary :: Maybe String -> String -> Maybe JSON -> Maybe Bool -> IO String,
  resetLeaf :: () -> IO (),
  
  -- Extract branch
  createBranchedSession :: String -> IO (Maybe String),
  
  -- Fork from another session
  forkFrom :: String -> String -> Maybe String -> IO SessionManager,
  
  -- List sessions
  list :: String -> Maybe String -> Maybe (Int -> Int -> IO ()) -> IO [SessionInfo],
  listAll :: Maybe (Int -> Int -> IO ()) -> IO [SessionInfo]
}

data SessionContext = SessionContext {
  messages :: [Message],
  thinkingLevel :: ThinkingLevel,
  model :: Maybe Model
}

data SessionTreeNode = SessionTreeNode {
  id :: String,
  parentId :: Maybe String,
  timestamp :: Timestamp,
  nodeType :: SessionNodeType,
  children :: [SessionTreeNode],
  label :: Maybe String
}

type SessionNodeType
  = MessageNode { role :: String, preview :: String }
  | ToolResultNode { toolName :: String, toolArgs :: JSON, preview :: String }
  | CompactionNode { tokensBefore :: Int }
  | ModelChangeNode { provider :: Provider, modelId :: String }
  | ThinkingLevelChangeNode { thinkingLevel :: ThinkingLevel }
  | BranchSummaryNode { summary :: String }
  | CustomMessageNode { customType :: String, preview :: String }
```

---

## Layer 3: Coding Agent (pi-coding-agent)

**Source**: `packages/coding-agent/src/core/agent-session.ts` and `docs/sdk.md`

### AgentSession API

```haskell
data PromptOptions = PromptOptions {
  images :: Maybe [ImageContent],
  streamingBehavior :: Maybe StreamingBehavior
}

type StreamingBehavior = "steer" | "followUp"

data HookMessage = HookMessage {
  -- Extension-specific hook data
}

data CompactionResult = CompactionResult {
  summary :: String,
  firstKeptEntryId :: String,
  tokensBefore :: Int,
  details :: JSON
}

data ModelCycleResult = ModelCycleResult {
  model :: Model,
  thinkingLevel :: ThinkingLevel,
  isScoped :: Bool
}

data ForkResult = ForkResult {
  selectedText :: String,
  cancelled :: Bool
}

data NavigateTreeResult = NavigateTreeResult {
  editorText :: Maybe String,
  cancelled :: Bool
}

class AgentSession where
  -- Prompting
  prompt :: AgentSession -> String -> Maybe PromptOptions -> IO ()
  steer :: AgentSession -> String -> IO ()
  followUp :: AgentSession -> String -> IO ()
  
  -- Subscription
  subscribe :: AgentSession -> (AgentSessionEvent -> IO ()) -> IO (IO ())
  
  -- Session info
  sessionFile :: AgentSession -> Maybe String
  sessionId :: AgentSession -> String
  
  -- Model control
  setModel :: AgentSession -> Model -> IO ()
  setThinkingLevel :: AgentSession -> ThinkingLevel -> IO ()
  cycleModel :: AgentSession -> IO (Maybe ModelCycleResult)
  cycleThinkingLevel :: AgentSession -> IO (Maybe ThinkingLevel)
  
  -- State access
  agent :: AgentSession -> Agent
  model :: AgentSession -> Maybe Model
  thinkingLevel :: AgentSession -> ThinkingLevel
  messages :: AgentSession -> [Message]
  isStreaming :: AgentSession -> Bool
  
  -- Session management
  newSession :: AgentSession -> Maybe { parentSession :: String } -> IO Bool
  switchSession :: AgentSession -> String -> IO Bool
  
  -- Branching
  fork :: AgentSession -> String -> IO ForkResult
  navigateTree :: AgentSession -> String -> Maybe NavigateTreeOptions -> IO NavigateTreeResult
  
  -- Hook interaction
  sendHookMessage :: AgentSession -> HookMessage -> Maybe Bool -> IO ()
  
  -- Compaction
  compact :: AgentSession -> Maybe String -> IO CompactionResult
  abortCompaction :: AgentSession -> IO ()
  
  -- Abort
  abort :: AgentSession -> IO ()
  
  -- Cleanup
  dispose :: AgentSession -> IO ()

type AgentSessionEvent = ...  -- See RPC section
```

### Agent class

```haskell
class Agent where
  state :: Agent -> AgentState
  replaceMessages :: Agent -> [Message] -> IO ()
  waitForIdle :: Agent -> IO ()
```

### Resource Loader

```haskell
data LoadExtensionsResult = LoadExtensionsResult {
  extensions :: [Extension],
  errors :: [(String, String)],
  runtime :: ExtensionRuntime
}

class ResourceLoader where
  reload :: ResourceLoader -> IO (),
  getExtensions :: ResourceLoader -> [Extension],
  getSkills :: ResourceLoader -> [Skill],
  getPrompts :: ResourceLoader -> [PromptTemplate],
  getThemes :: ResourceLoader -> [Theme],
  getAgentsFiles :: ResourceLoader -> { agentsFiles :: [AgentsFile], diagnostics :: [Diagnostic] }

data DefaultResourceLoader = DefaultResourceLoader {
  cwd :: String,
  agentDir :: String,
  
  -- Overrides for customization
  systemPromptOverride :: Maybe (IO String),
  additionalExtensionPaths :: [String],
  extensionFactories :: [ExtensionAPI -> IO ()],
  skillsOverride :: Maybe (SkillsResult -> SkillsResult),
  promptsOverride :: Maybe (PromptsResult -> PromptsResult),
  agentsFilesOverride :: Maybe (AgentsFilesResult -> AgentsFilesResult),
  eventBus :: Maybe EventBus,
  settingsManager :: Maybe SettingsManager
}

newDefaultResourceLoader :: DefaultResourceLoader
reloadDefaultResourceLoader :: DefaultResourceLoader -> IO ()
```

### createAgentSession Factory

```haskell
data CreateAgentSessionOptions = CreateAgentSessionOptions {
  cwd :: Maybe String,
  agentDir :: Maybe String,
  
  -- Model & Thinking
  model :: Maybe Model,
  thinkingLevel :: Maybe ThinkingLevel,
  scopedModels :: Maybe [{ model :: Model, thinkingLevel :: ThinkingLevel }],
  
  -- Auth
  authStorage :: Maybe AuthStorage,
  modelRegistry :: Maybe ModelRegistry,
  
  -- Tools
  tools :: Maybe [Tool],
  customTools :: Maybe [ToolDefinition],
  
  -- Resources
  resourceLoader :: Maybe ResourceLoader,
  
  -- Session & Settings
  sessionManager :: Maybe SessionManager,
  settingsManager :: Maybe SettingsManager
}

data CreateAgentSessionResult = CreateAgentSessionResult {
  session :: AgentSession,
  extensionsResult :: LoadExtensionsResult,
  modelFallbackMessage :: Maybe String
}

createAgentSession :: Maybe CreateAgentSessionOptions -> IO CreateAgentSessionResult
```

### Built-in Tools

```haskell
-- Tool factory signatures
readTool :: Tool
bashTool :: Tool
editTool :: Tool
writeTool :: Tool
grepTool :: Tool
findTool :: Tool
lsTool :: Tool

createReadTool :: String -> Tool
createBashTool :: String -> Tool
createEditTool :: String -> Tool
createWriteTool :: String -> Tool
createGrepTool :: String -> Tool
createFindTool :: String -> Tool
createLsTool :: String -> Tool

codingTools :: [Tool]
readOnlyTools :: [Tool]

createCodingTools :: String -> [Tool]
createReadOnlyTools :: String -> [Tool]
```

### Settings Management

```haskell
data SettingsManager = SettingsManager {
  -- Getters/setters for config
  getCompactionEnabled :: () -> Bool,
  setCompactionEnabled :: Bool -> IO (),
  
  getRetryEnabled :: () -> Bool,
  setRetryEnabled :: Bool -> IO (),
  
  getMaxRetries :: () -> Int,
  setMaxRetries :: Int -> IO (),
  
  -- File I/O
  flush :: () -> IO (),
  drainErrors :: () -> [String]
}

-- Factories
createSettingsManager :: Maybe String -> Maybe String -> IO SettingsManager
createInMemorySettingsManager :: Maybe JSON -> IO SettingsManager
```

### Auth Storage

```haskell
data AuthStorage = AuthStorage {
  setRuntimeApiKey :: String -> String -> IO (),
  getRuntimeApiKey :: String -> Maybe String,
  
  -- Stored credentials
  getStoredKey :: String -> Maybe String,
  setStoredKey :: String -> String -> IO ()
}

createAuthStorage :: IO AuthStorage
createCustomAuthStorage :: String -> IO AuthStorage
```

### Model Registry

```haskell
data ModelRegistry = ModelRegistry {
  find :: String -> String -> Maybe Model,
  getAvailable :: () -> IO [Model]
}

createModelRegistry :: AuthStorage -> IO ModelRegistry
createModelRegistryWithCustom :: AuthStorage -> String -> IO ModelRegistry
```

---

## Layer 4: RPC Protocol (pi-coding-agent)

**Source**: `packages/coding-agent/docs/rpc.md`

### Core Protocol Structure

```haskell
-- Commands (stdin)
data Command
  -- Prompting
  = PromptCommand { id :: Maybe String, message :: String, images :: Maybe [ImageContent], streamingBehavior :: Maybe StreamingBehavior }
  | SteerCommand { id :: Maybe String, message :: String, images :: Maybe [ImageContent] }
  | FollowUpCommand { id :: Maybe String, message :: String, images :: Maybe [ImageContent] }
  | AbortCommand
  
  -- State
  | GetStateCommand
  | GetMessagesCommand
  
  -- Model
  | SetModelCommand { provider :: Provider, modelId :: String }
  | CycleModelCommand
  | GetAvailableModelsCommand
  
  -- Thinking
  | SetThinkingLevelCommand { level :: ThinkingLevel }
  | CycleThinkingLevelCommand
  
  -- Queue modes
  | SetSteeringModeCommand { mode :: SteeringMode }
  | SetFollowUpModeCommand { mode :: FollowUpMode }
  
  -- Compaction
  | CompactCommand { customInstructions :: Maybe String }
  | SetAutoCompactionCommand { enabled :: Bool }
  
  -- Retry
  | SetAutoRetryCommand { enabled :: Bool }
  | AbortRetryCommand
  
  -- Bash
  | BashCommand { command :: String }
  | AbortBashCommand
  
  -- Session
  | GetSessionStatsCommand
  | ExportHtmlCommand { outputPath :: Maybe String }
  | SwitchSessionCommand { sessionPath :: String }
  | NewSessionCommand { parentSession :: Maybe String }
  | SetSessionNameCommand { name :: String }
  | ListSessionsCommand { scope :: SessionListScope }
  | GetForkMessagesCommand
  | ForkCommand { entryId :: String }
  | GetLastAssistantTextCommand
  
  -- Tree
  | GetTreeCommand
  | SetLabelCommand { entryId :: String, label :: Maybe String }
  | NavigateTreeCommand { targetId :: String, summarize :: Maybe Bool, customInstructions :: Maybe String, replaceInstructions :: Maybe Bool, label :: Maybe String }
  | AbortBranchSummaryCommand
  
  -- Commands
  | GetCommandsCommand

type SteeringMode = "all" | "one-at-a-time"
type FollowUpMode = "all" | "one-at-a-time"
type SessionListScope = "current" | "all"

-- Responses (stdout)
data Response = Response {
  id :: Maybe String,
  type :: "response",
  command :: String,
  success :: Bool,
  error :: Maybe String,
  data :: Maybe JSON
}

-- Events (stdout, streamed)
type Event
  = AgentStartEvent
  | AgentEndEvent { messages :: [Message] }
  | TurnStartEvent
  | TurnEndEvent { message :: Message, toolResults :: [ToolResultMessage] }
  | MessageStartEvent { message :: Message }
  | MessageUpdateEvent { message :: Message, assistantMessageEvent :: AssistantMessageEvent }
  | MessageEndEvent { message :: Message }
  | ToolExecutionStartEvent { toolCallId :: String, toolName :: String, args :: JSON }
  | ToolExecutionUpdateEvent { toolCallId :: String, toolName :: String, args :: JSON, partialResult :: JSON }
  | ToolExecutionEndEvent { toolCallId :: String, toolName :: String, result :: JSON, isError :: Bool }
  | AutoCompactionStartEvent { reason :: String }
  | AutoCompactionEndEvent { result :: Maybe CompactionResult, aborted :: Bool, willRetry :: Bool, errorMessage :: Maybe String }
  | AutoRetryStartEvent { attempt :: Int, maxAttempts :: Int, delayMs :: Int, errorMessage :: String }
  | AutoRetryEndEvent { success :: Bool, attempt :: Int, finalError :: Maybe String }
  | ExtensionErrorEvent { extensionPath :: String, event :: String, error :: String }
```

### Response Data Formats

```haskell
-- For get_state
data StateData = StateData {
  model :: Maybe Model,
  thinkingLevel :: ThinkingLevel,
  isStreaming :: Bool,
  isCompacting :: Bool,
  steeringMode :: SteeringMode,
  followUpMode :: FollowUpMode,
  sessionFile :: Maybe String,
  sessionId :: String,
  sessionName :: Maybe String,
  autoCompactionEnabled :: Bool,
  messageCount :: Int,
  pendingMessageCount :: Int
}

-- For get_session_stats
data SessionStats = SessionStats {
  sessionFile :: String,
  sessionId :: String,
  userMessages :: Int,
  assistantMessages :: Int,
  toolCalls :: Int,
  toolResults :: Int,
  totalMessages :: Int,
  tokens :: TokenUsage,
  cost :: Float
}

data TokenUsage = TokenUsage {
  input :: Int,
  output :: Int,
  cacheRead :: Int,
  cacheWrite :: Int,
  total :: Int
}

-- For get_tree
data TreeData = TreeData {
  leafId :: Maybe String,
  tree :: [TreeNode]
}

-- Tree node variants
data TreeNode
  = MessageNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      role :: String,  -- "user", "assistant", "bashExecution", "custom", etc.
      preview :: String,
      label :: Maybe String,
      children :: [TreeNode],
      stopReason :: Maybe StopReason,
      errorMessage :: Maybe String
    }
  | ToolResultNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      toolName :: String,
      toolArgs :: JSON,
      formattedToolCall :: String,
      preview :: String,
      label :: Maybe String,
      children :: [TreeNode]
    }
  | CompactionNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      tokensBefore :: Int,
      label :: Maybe String,
      children :: [TreeNode]
    }
  | ModelChangeNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      provider :: Provider,
      modelId :: String,
      label :: Maybe String,
      children :: [TreeNode]
    }
  | ThinkingLevelChangeNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      thinkingLevel :: ThinkingLevel,
      label :: Maybe String,
      children :: [TreeNode]
    }
  | BranchSummaryNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      summary :: String,
      label :: Maybe String,
      children :: [TreeNode]
    }
  | CustomMessageNode {
      id :: String,
      parentId :: Maybe String,
      timestamp :: Timestamp,
      customType :: String,
      preview :: String,
      label :: Maybe String,
      children :: [TreeNode]
    }

-- For list_sessions
data SessionInfo = SessionInfo {
  path :: String,
  id :: String,
  cwd :: String,
  name :: Maybe String,
  created :: Timestamp,
  modified :: Timestamp,
  messageCount :: Int,
  firstMessage :: String,
  allMessagesText :: String
}

-- For get_commands
data CommandInfo = CommandInfo {
  name :: String,
  description :: Maybe String,
  source :: CommandSource,  -- "extension", "prompt", "skill"
  location :: Maybe CommandLocation,  -- "user", "project", "path"
  path :: Maybe String
}

type CommandSource = "extension" | "prompt" | "skill"
type CommandLocation = "user" | "project" | "path"
```

### Extension UI Protocol (Sub-protocol)

```haskell
-- Extension UI Requests (stdout)
data ExtensionUIRequest
  = SelectRequest {
      id :: String,
      title :: String,
      options :: [String],
      timeout :: Maybe Int
    }
  | ConfirmRequest {
      id :: String,
      title :: String,
      message :: Maybe String,
      timeout :: Maybe Int
    }
  | InputRequest {
      id :: String,
      title :: String,
      placeholder :: Maybe String
    }
  | EditorRequest {
      id :: String,
      title :: String,
      prefill :: Maybe String
    }
  | NotifyRequest {
      id :: String,
      message :: String,
      notifyType :: Maybe NotifyType
    }
  | SetStatusRequest {
      id :: String,
      statusKey :: String,
      statusText :: Maybe String
    }
  | SetWidgetRequest {
      id :: String,
      widgetKey :: String,
      widgetLines :: Maybe [String],
      widgetPlacement :: Maybe WidgetPlacement
    }
  | SetTitleRequest {
      id :: String,
      title :: String
    }
  | SetEditorTextRequest {
      id :: String,
      text :: String
    }

type NotifyType = "info" | "warning" | "error"
type WidgetPlacement = "aboveEditor" | "belowEditor"

-- Extension UI Responses (stdin, for dialog methods only)
data ExtensionUIResponse
  = ValueResponse { id :: String, value :: String }
  | ConfirmResponse { id :: String, confirmed :: Bool }
  | CancelResponse { id :: String }
```

---

## Layer 5: Extension System (pi-coding-agent)

**Source**: `packages/coding-agent/docs/extensions.md`

### Extension API

```haskell
data ExtensionAPI = ExtensionAPI {
  -- Event subscription
  on :: String -> (Event -> ExtensionContext -> IO (Maybe BlockReason)) -> IO (),
  
  -- Tool registration
  registerTool :: ToolDefinition -> IO (),
  
  -- Command registration
  registerCommand :: String -> CommandDefinition -> IO (),
  
  -- Session persistence
  appendEntry :: String -> Maybe JSON -> IO String,
  
  -- Message sending
  sendMessage :: String -> Maybe [ImageContent] -> IO (),
  
  -- Event bus
  events :: EventBus
}

data EventBus = EventBus {
  on :: String -> (JSON -> IO ()) -> IO (IO ()),
  emit :: String -> JSON -> IO ()
}
```

### Extension Events

```haskell
-- Lifecycle
data Event
  = SessionStartEvent
  | SessionEndEvent
  
  -- Agent
  | AgentStartEvent
  | AgentEndEvent { messages :: [Message] }
  
  -- Turns
  | TurnStartEvent
  | TurnEndEvent { message :: Message, toolResults :: [ToolResultMessage] }
  
  -- Messages
  | MessageStartEvent { message :: Message }
  | MessageUpdateEvent { message :: Message, assistantMessageEvent :: AssistantMessageEvent }
  | MessageEndEvent { message :: Message }
  
  -- Tool calls
  | ToolCallEvent { toolName :: String, input :: JSON }
  | ToolExecutionStartEvent { toolCallId :: String, toolName :: String, args :: JSON }
  | ToolExecutionUpdateEvent { toolCallId :: String, toolName :: String, partialResult :: JSON }
  | ToolExecutionEndEvent { toolCallId :: String, toolName :: String, result :: JSON, isError :: Bool }
  
  -- Session management
  | SessionBeforeSwitchEvent { sessionPath :: String }
  | SessionAfterSwitchEvent { sessionPath :: String }
  | SessionBeforeForkEvent { entryId :: String }
  | SessionAfterForkEvent { newSessionPath :: String }
  
  -- Branching/Compaction
  | BranchSummaryRequestedEvent { fromId :: String }
  | CompactionRequestedEvent { customInstructions :: Maybe String }
  
  -- Custom
  | CustomEvent { type :: String, data :: JSON }

-- Some events can be blocked
data BlockReason = BlockReason { reason :: String }
```

### Extension Context

```haskell
data ExtensionContext = ExtensionContext {
  ui :: ExtensionUIContext,
  agent :: Agent,
  sessionManager :: Maybe SessionManager,
  hasUI :: Bool
}

-- UI context for extension interaction
data ExtensionUIContext = ExtensionUIContext {
  -- Dialog methods
  select :: String -> [String] -> Maybe Int -> IO (Maybe String),
  confirm :: String -> Maybe String -> Maybe Int -> IO Bool,
  input :: String -> Maybe String -> Maybe Int -> IO (Maybe String),
  editor :: String -> Maybe String -> Maybe Int -> IO (Maybe String),
  
  -- Fire-and-forget methods
  notify :: String -> Maybe NotifyType -> IO (),
  setStatus :: String -> Maybe String -> IO (),
  setWidget :: String -> Maybe [String] -> Maybe WidgetPlacement -> IO (),
  setTitle :: String -> IO (),
  setEditorText :: String -> IO (),
  
  -- TUI-specific (limited in RPC mode)
  custom :: IO (Maybe TUIComponent),
  setWorkingMessage :: Maybe String -> IO (),
  setFooter :: Maybe String -> IO (),
  setHeader :: Maybe String -> IO (),
  setEditorComponent :: Maybe EditorComponent -> IO (),
  setToolsExpanded :: Bool -> IO (),
  getEditorText :: () -> String,
  getToolsExpanded :: () -> Bool,
  pasteToEditor :: String -> IO (),
  getAllThemes :: () -> [Theme],
  getTheme :: () -> Maybe Theme,
  setTheme :: Theme -> IO ThemeChangeResult
}
```

### Tool Definition (for Extensions)

```haskell
data ToolDefinition = ToolDefinition {
  name :: String,
  label :: String,
  description :: String,
  parameters :: JSONSchema,  -- TypeBox schema
  execute :: String -> JSON -> Maybe AbortSignal -> Maybe (JSON -> IO ()) -> ExtensionContext -> IO (ToolResult JSON JSON)
}

-- Tool result for extensions
data ToolResult a b = ToolResult {
  content :: [TextContent | ImageContent],
  details :: b
}
```

### Command Definition (for Extensions)

```haskell
data CommandDefinition = CommandDefinition {
  description :: Maybe String,
  handler :: String -> ExtensionCommandContext -> IO ()
}

data ExtensionCommandContext = ExtensionCommandContext {
  ui :: ExtensionUIContext,
  agent :: Agent,
  sessionManager :: Maybe SessionManager,
  sendMessage :: String -> Maybe [ImageContent] -> IO ()
}
```

---

## Summary: Type Hierarchy

```
Layer 0 (pi-ai): Core LLM abstractions
├── TextContent, ImageContent, ThinkingContent, ToolCall
├── UserMessage, AssistantMessage, ToolResultMessage
├── Model, Tool, Context
└── AssistantMessageEvent (streaming deltas)

Layer 1 (pi-agent): Agent loop
├── AgentState, AgentMessage, AgentTool
├── AgentEvent, AgentLoopConfig
└── (minimal, focused on LLM interaction)

Layer 2 (pi-coding-agent): Session & persistence
├── SessionEntry (10+ variants), SessionManager
├── SessionTreeNode, SessionContext
└── (immutable log, branching, tree structure)

Layer 3 (pi-coding-agent): High-level harness
├── AgentSession (factory, orchestration)
├── ResourceLoader, AuthStorage, ModelRegistry
├── SettingsManager, SessionManager wrappers
└── (full feature parity with interactive mode)

Layer 4 (pi-coding-agent): JSON-RPC protocol
├── Command, Response, Event (JSON-serializable)
├── ExtensionUIRequest, ExtensionUIResponse
└── (subprocess integration via stdio)

Layer 5 (pi-coding-agent): Plugin system
├── ExtensionAPI, EventBus
├── ToolDefinition, CommandDefinition
└── (runtime extension hooks)
```

---

## Key Design Patterns

### 1. **Immutable Append-Only Logs**
   - SessionEntry types form tree via `parentId`
   - No mutation, only append
   - Enables branching, forking, replay

### 2. **Streaming First**
   - AssistantMessageEvent for delta-by-delta updates
   - Tool execution updates during execution
   - Built-in AbortSignal for cancellation

### 3. **Extensibility via Events + Hooks**
   - Extensions subscribe to agent/session events
   - Can block tool calls, inject context, customize compaction
   - Custom messages persist in session tree

### 4. **Resource Loading**
   - DefaultResourceLoader discovers extensions, skills, prompts, themes
   - Per-project + global hierarchy
   - Pluggable ResourceLoader interface

### 5. **Multi-Mode Execution**
   - Interactive TUI mode
   - Print mode (one response, exit)
   - RPC mode (JSON stdio protocol)
   - SDK (programmatic, in-process)

### 6. **Session as First-Class**
   - SessionManager: tree navigation, branching, compaction
   - SessionInfo: metadata, search, list
   - Lineage: parentSession for audit trails

---

## Files to Reference

- **Agent Core Types**: `packages/agent/src/types.ts`
- **AI Types**: `packages/ai/src/types.ts`
- **Session Manager**: `packages/coding-agent/src/core/session-manager.ts`
- **Agent Session**: `packages/coding-agent/src/core/agent-session.ts`
- **RPC Protocol**: `packages/coding-agent/docs/rpc.md`
- **Extension System**: `packages/coding-agent/docs/extensions.md`
- **SDK Docs**: `packages/coding-agent/docs/sdk.md`
- **Session Docs**: `packages/coding-agent/docs/session.md` (upstream) + `~/mg/buff/session.md` (local)
