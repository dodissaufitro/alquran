import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'

type BackHandler = () => void

type BackNavigationContextValue = {
  registerHandler: (handler: BackHandler) => () => void
}

const BackNavigationContext = createContext<BackNavigationContextValue | null>(null)

export function BackNavigationProvider({
  children,
  onRootBack,
}: {
  children: ReactNode
  onRootBack: () => void
}) {
  const handlersRef = useRef<BackHandler[]>([])
  const onRootBackRef = useRef(onRootBack)
  onRootBackRef.current = onRootBack

  const registerHandler = useCallback((handler: BackHandler) => {
    handlersRef.current.push(handler)
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler)
    }
  }, [])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let listenerHandle: PluginListenerHandle | undefined
  
      void CapApp.addListener('backButton', () => {
        const stack = handlersRef.current
        if (stack.length > 0) {
          stack[stack.length - 1]()
          return
        }
        onRootBackRef.current()
      }).then((handle) => {
        listenerHandle = handle
      })
  
      return () => {
        void listenerHandle?.remove()
      }
    }

    // Web Platform: Cegah back button browser lari ke admin.html atau luar SPA
    window.history.pushState({ internalBack: true }, '')
    const handlePopState = () => {
      // Kembalikan state agar selalu terperangkap di dalam SPA
      window.history.pushState({ internalBack: true }, '')
      
      const stack = handlersRef.current
      if (stack.length > 0) {
        stack[stack.length - 1]()
        return
      }
      onRootBackRef.current()
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const value = useMemo(() => ({ registerHandler }), [registerHandler])

  return (
    <BackNavigationContext.Provider value={value}>{children}</BackNavigationContext.Provider>
  )
}

export function useBackHandler(handler: () => void, enabled = true) {
  const ctx = useContext(BackNavigationContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!ctx || !enabled) return
    const wrapped = () => handlerRef.current()
    return ctx.registerHandler(wrapped)
  }, [ctx, enabled])
}

export function useBackNavigation() {
  const ctx = useContext(BackNavigationContext)
  if (!ctx) {
    throw new Error('useBackNavigation must be used within BackNavigationProvider')
  }
  return ctx
}
