# Implementation Plan

## Implementation Strategy

This implementation follows a **phased MVP (Minimum Viable Product) approach** to minimize risk and ensure early validation of the Tauri Mobile conversion. Each phase builds upon the previous one and includes validation checkpoints.

### Phase 1: Foundation & Validation (Tasks 1-4)
**Goal**: Validate Tauri Mobile feasibility and establish basic mobile infrastructure
**Duration**: ~2-3 weeks
**Key Deliverable**: Initial test APK with basic mobile UI

**Success Criteria**:
- Tauri Mobile environment working correctly
- Basic mobile UI responsive and functional
- Initial APK can be installed and launched on Android
- Platform detection system operational

**Risk Mitigation**: If Tauri Mobile proves unstable, consider alternative approaches before proceeding

### Phase 2: Core Features (Tasks 5-7)
**Goal**: Implement essential investment tracking functionality for mobile
**Duration**: ~3-4 weeks  
**Key Deliverable**: Feature-complete test APK with core functionality

**Success Criteria**:
- Portfolio dashboard displays correctly on mobile
- Basic transaction and account management working
- Data display components functional (cards/lists)
- Core user workflows operational

**Focus**: Prioritize viewing and basic data entry over advanced features

### Phase 3: Enhancement & Polish (Tasks 8-13)
**Goal**: Optimize performance, add advanced features, and prepare for personal use
**Duration**: ~2-3 weeks
**Key Deliverable**: Production-ready personal APK

**Success Criteria**:
- Performance optimized for mobile devices
- Data backup/restore functionality working
- Comprehensive testing completed
- Final APK ready for personal installation

**Optional Features**: Advanced gestures, complex animations, extensive testing automation

## Task Organization by Phase

## Phase 1: Foundation & Validation

- [ ] 1. Setup and Validate Tauri Mobile Development Environment

  **Prerequisites Check**:
  - [ ] Verify current Tauri version is 2.x (check `package.json` and `Cargo.toml`)
  - [ ] Ensure Node.js 18+ and Rust 1.70+ are installed
  - [ ] Confirm macOS development environment (required for this setup)

  **Step 1: Install Android Development Tools**
  ```bash
  # Install Android Studio from https://developer.android.com/studio
  # During installation, ensure these components are selected:
  # - Android SDK
  # - Android SDK Platform-Tools  
  # - Android Virtual Device (AVD)
  # - Intel x86 Emulator Accelerator (HAXM installer) - for Intel Macs
  ```

  **Step 2: Configure Android SDK Environment**
  ```bash
  # Add to ~/.zshrc or ~/.bash_profile:
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

  # Reload shell configuration
  source ~/.zshrc
  ```

  **Step 3: Install Required Android Components**
  ```bash
  # Install Android SDK components
  sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
  sdkmanager "system-images;android-33;google_apis;arm64-v8a"  # For Apple Silicon
  # OR for Intel Macs:
  # sdkmanager "system-images;android-33;google_apis;x86_64"
  ```

  **Step 4: Create Android Virtual Device**
  ```bash
  # Create AVD
  avdmanager create avd -n "Pixel_7_API_33" -k "system-images;android-33;google_apis;arm64-v8a" -d "pixel_7"
  
  # Verify AVD creation
  avdmanager list avd
  ```

  **Step 5: Install Tauri Mobile Prerequisites**
  ```bash
  # Install Tauri CLI with mobile support
  cargo install tauri-cli --version "^2.0" --features mobile

  # Verify installation
  cargo tauri --version
  ```

  **Step 6: Validate Tauri Mobile Setup**
  Create a minimal test project to verify Tauri Mobile works:
  ```bash
  # Create test directory
  mkdir tauri-mobile-test && cd tauri-mobile-test

  # Initialize minimal Tauri project
  cargo tauri init --mobile

  # Try to add Android target
  cargo tauri android init
  ```

  **Step 7: Test Android Build Process**
  ```bash
  # Start Android emulator
  emulator -avd Pixel_7_API_33

  # Attempt to build and run on Android (this may fail - that's expected)
  cargo tauri android dev
  ```

  **Validation Criteria**:
  - [ ] Android Studio launches without errors
  - [ ] `sdkmanager --list` shows installed components
  - [ ] Android emulator starts successfully
  - [ ] `cargo tauri android init` completes without errors
  - [ ] Can see Android project files generated in `src-tauri/gen/android/`

  **Expected Issues & Solutions**:
  - **Issue**: "ANDROID_HOME not found"
    - **Solution**: Verify environment variables are set correctly
  - **Issue**: "No Android targets found"
    - **Solution**: Install Android SDK platforms using sdkmanager
  - **Issue**: Emulator won't start
    - **Solution**: Enable hardware acceleration in BIOS/System Preferences

  **Success Criteria**: 
  - Android emulator runs
  - Tauri can generate Android project structure
  - No critical environment setup errors

  _Requirements: 1.1, 6.4_

- [ ] 2. Configure Mobile Build System
  - [ ] 2.1 Add Android target configuration to Cargo.toml

    **Current State Analysis**:
    First, examine the existing `src-tauri/Cargo.toml` to understand current dependencies:
    ```toml
    # Current desktop-only dependencies that need mobile adaptation:
    tauri-plugin-updater = "2.7.0"  # Desktop only
    tauri-plugin-window-state = "2"  # Desktop only
    ```

    **Implementation Options**:

    **Option A: Feature Flags Approach (Recommended)**
    ```toml
    [features]
    default = ["desktop"]
    desktop = ["tauri-plugin-updater", "tauri-plugin-window-state"]
    mobile = []

    [dependencies]
    # Shared dependencies (keep existing)
    wealthfolio_core = { path = "../src-core" }
    tauri = { version = "2.4.1", features = [] }
    diesel = { version = "2.2", features = ["sqlite", "chrono", "r2d2", "numeric", "returning_clauses_for_sqlite_3_35"] }
    # ... other shared dependencies

    # Desktop-only dependencies
    [target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
    tauri-plugin-updater = "2.7.0"
    tauri-plugin-window-state = "2"

    # Mobile-specific dependencies (add as needed)
    [target.'cfg(any(target_os = "android", target_os = "ios"))'.dependencies]
    # Add mobile-specific plugins here when available
    ```

    **Option B: Separate Mobile Cargo.toml (Alternative)**
    Create `src-tauri/Cargo-mobile.toml` with mobile-specific configuration.
    - **Pros**: Clean separation, no conditional compilation complexity
    - **Cons**: Duplicate configuration, harder to maintain

    **Recommended Choice**: Option A - Feature flags provide better maintainability.

    **Step-by-Step Implementation**:

    1. **Backup current Cargo.toml**:
    ```bash
    cp src-tauri/Cargo.toml src-tauri/Cargo.toml.backup
    ```

    2. **Update Cargo.toml with conditional dependencies**:
    ```toml
    # Add this section to move desktop-only plugins
    [target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
    tauri-plugin-updater = "2.7.0"
    tauri-plugin-window-state = "2"
    ```

    3. **Remove desktop-only plugins from main dependencies section**:
    Remove these lines from `[dependencies]`:
    ```toml
    # Remove these:
    # tauri-plugin-updater = "2.7.0"
    # tauri-plugin-window-state = "2"
    ```

    4. **Update main.rs to handle conditional compilation**:
    ```rust
    // In src-tauri/src/main.rs, wrap desktop-only plugins:
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    use tauri_plugin_updater;
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    use tauri_plugin_window_state;

    // In the builder chain:
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init());

    // Add desktop-only plugins conditionally
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_window_state::Builder::new().build());
    }

    let app = builder.build(tauri::generate_context!())?;
    ```

    **Validation Steps**:
    1. **Test desktop build still works**:
    ```bash
    cargo tauri build
    ```

    2. **Test mobile compilation**:
    ```bash
    cargo tauri android init  # Should not fail due to missing dependencies
    ```

    3. **Verify conditional compilation**:
    ```bash
    # Check that mobile target doesn't include desktop plugins
    cargo tree --target aarch64-linux-android | grep -E "(updater|window-state)"
    # Should return no results
    ```

    **Common Issues & Solutions**:
    - **Issue**: "Cannot find plugin" errors
      - **Solution**: Ensure conditional compilation wraps both imports and usage
    - **Issue**: Build fails on mobile target
      - **Solution**: Check that all desktop-only dependencies are properly conditionally compiled

    **Success Criteria**:
    - [ ] Desktop build continues to work without changes
    - [ ] Mobile target compilation doesn't fail due to desktop-only dependencies
    - [ ] `cargo check --target aarch64-linux-android` passes
    - [ ] No desktop-only plugins appear in mobile dependency tree

    _Requirements: 6.1, 6.2_

  - [ ] 2.2 Create mobile-specific Tauri configuration

    **Current Configuration Analysis**:
    Examine existing `src-tauri/tauri.conf.json`:
    ```json
    {
      "productName": "Wealthfolio",
      "identifier": "com.teymz.wealthfolio",
      "version": "1.1.6"
    }
    ```

    **Mobile Configuration Options**:

    **Option A: Single Configuration File (Recommended)**
    Extend existing `tauri.conf.json` with mobile-specific sections:

    ```json
    {
      "productName": "Wealthfolio",
      "mainBinaryName": "Wealthfolio", 
      "version": "1.1.6",
      "identifier": "com.teymz.wealthfolio",
      
      // Add mobile-specific configuration
      "mobile": {
        "android": {
          "minSdkVersion": 24,
          "compileSdkVersion": 33,
          "targetSdkVersion": 33,
          "versionCode": 116,  // Increment for each release
          "permissions": [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE"
          ],
          "allowBackup": true,
          "largeHeap": true
        }
      },

      // Update bundle configuration for mobile
      "bundle": {
        "active": true,
        "targets": ["android", "desktop"],  // Add android target
        "icon": [
          "icons/32x32.png",
          "icons/128x128.png", 
          "icons/128x128@2x.png",
          "icons/icon.icns",
          "icons/icon.ico"
        ],
        "copyright": "2025 Teymz Inc.",
        "category": "Finance"
      },

      // Desktop-specific app configuration
      "app": {
        "withGlobalTauri": true,
        "windows": [
          {
            "dragDropEnabled": false,
            "fullscreen": false,
            "resizable": true,
            "theme": "Light",
            "titleBarStyle": "Overlay",
            "hiddenTitle": true,
            "title": "Wealthfolio",
            "width": 1440,
            "height": 960,
            "center": true
          }
        ],
        "security": {
          "csp": null
        }
      }
    }
    ```

    **Option B: Separate Mobile Configuration**
    Create `src-tauri/tauri.mobile.conf.json` for mobile-only settings.
    - **Pros**: Clean separation, no desktop interference
    - **Cons**: Configuration duplication, harder to maintain shared settings

    **Recommended Choice**: Option A - Single file with mobile sections.

    **Step-by-Step Implementation**:

    1. **Backup existing configuration**:
    ```bash
    cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.backup
    ```

    2. **Add mobile section to tauri.conf.json**:
    ```json
    {
      // ... existing configuration ...
      
      "mobile": {
        "android": {
          "minSdkVersion": 24,
          "compileSdkVersion": 33,
          "targetSdkVersion": 33,
          "versionCode": 116,
          "permissions": [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE"
          ],
          "allowBackup": true,
          "largeHeap": true,
          "theme": "@android:style/Theme.DeviceDefault.Light.NoActionBar"
        }
      }
    }
    ```

    3. **Update bundle targets**:
    ```json
    {
      "bundle": {
        "targets": ["android", "desktop"],
        // ... rest of bundle config
      }
    }
    ```

    4. **Create Android-specific icons** (if needed):
    ```bash
    # Android requires specific icon sizes
    # Create these in src-tauri/icons/:
    # - icon-36x36.png (ldpi)
    # - icon-48x48.png (mdpi) 
    # - icon-72x72.png (hdpi)
    # - icon-96x96.png (xhdpi)
    # - icon-144x144.png (xxhdpi)
    # - icon-192x192.png (xxxhdpi)
    ```

    **Permission Configuration Guide**:

    **Essential Permissions**:
    ```json
    "permissions": [
      "android.permission.INTERNET",              // For market data
      "android.permission.ACCESS_NETWORK_STATE",  // Check connectivity
      "android.permission.READ_EXTERNAL_STORAGE", // Import CSV files
      "android.permission.WRITE_EXTERNAL_STORAGE" // Export data
    ]
    ```

    **Optional Permissions** (add if needed):
    ```json
    "permissions": [
      "android.permission.VIBRATE",               // Haptic feedback
      "android.permission.WAKE_LOCK",             // Prevent sleep during operations
      "android.permission.REQUEST_INSTALL_PACKAGES" // For APK updates
    ]
    ```

    **Android Manifest Customization**:
    If you need more control, create `src-tauri/gen/android/app/src/main/AndroidManifest.xml`:
    ```xml
    <application
        android:allowBackup="true"
        android:largeHeap="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">
        
        <!-- Add custom activities or services here -->
    </application>
    ```

    **Validation Steps**:

    1. **Validate JSON syntax**:
    ```bash
    # Use jq to validate JSON
    cat src-tauri/tauri.conf.json | jq '.'
    ```

    2. **Test configuration parsing**:
    ```bash
    cargo tauri android init
    # Should generate Android project without errors
    ```

    3. **Verify Android project generation**:
    ```bash
    ls src-tauri/gen/android/
    # Should contain: app/, gradle/, settings.gradle, etc.
    ```

    4. **Check generated AndroidManifest.xml**:
    ```bash
    cat src-tauri/gen/android/app/src/main/AndroidManifest.xml
    # Verify permissions and metadata are correct
    ```

    **Common Configuration Issues**:

    - **Issue**: "Invalid SDK version"
      - **Solution**: Ensure minSdkVersion ≤ targetSdkVersion ≤ compileSdkVersion
    - **Issue**: "Permission denied" errors
      - **Solution**: Add required permissions to the permissions array
    - **Issue**: "App crashes on startup"
      - **Solution**: Check theme compatibility and remove desktop-specific settings

    **Success Criteria**:
    - [ ] JSON configuration is valid (passes jq validation)
    - [ ] `cargo tauri android init` completes successfully
    - [ ] Generated AndroidManifest.xml contains correct permissions
    - [ ] Android project structure is created in `src-tauri/gen/android/`
    - [ ] No configuration-related errors in build process

    _Requirements: 7.2, 7.3_

  - [ ] 2.3 Setup mobile build scripts
    - Add npm scripts for mobile development and building (android:dev, android:build)
    - Create local build scripts for generating personal APKs
    - _Requirements: 7.1, 7.4_

  - [ ] 2.4 Generate initial test APK
    - Create debug APK build for initial mobile testing and validation
    - Document APK installation process and basic functionality verification
    - _Requirements: 7.1, 1.1_

- [ ] 3. Implement Platform Detection System
  - [ ] 3.1 Create platform detection utilities

    **Implementation Strategy**:
    Create a comprehensive platform detection system that works reliably across Tauri desktop and mobile environments.

    **Step 1: Create Core Platform Detection Utility**
    
    Create `src/lib/platform-detection.ts`:
    ```typescript
    export interface PlatformInfo {
      isMobile: boolean;
      isDesktop: boolean;
      isAndroid: boolean;
      isIOS: boolean;
      isTauri: boolean;
      screenSize: {
        width: number;
        height: number;
        orientation: 'portrait' | 'landscape';
      };
      touchCapable: boolean;
    }

    /**
     * Detection Methods Comparison:
     * 
     * Method 1: User Agent Detection (Least Reliable)
     * - Pros: Simple, works immediately
     * - Cons: Can be spoofed, unreliable
     * 
     * Method 2: Tauri API Detection (Most Reliable)
     * - Pros: Accurate, Tauri-specific
     * - Cons: Requires Tauri commands
     * 
     * Method 3: CSS Media Queries + Touch Detection (Recommended)
     * - Pros: Reliable, fast, no async calls needed
     * - Cons: May not distinguish between tablet and mobile
     */

    // Method 3 Implementation (Recommended)
    export function detectPlatform(): PlatformInfo {
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
      
      // Screen size detection
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
      
      // Touch capability detection
      const touchCapable = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 ||
                          // @ts-ignore - for older browsers
                          navigator.msMaxTouchPoints > 0;
      
      // Mobile detection based on screen size and touch
      const isMobileScreen = screenWidth <= 768; // Tailwind's md breakpoint
      const isMobile = isMobileScreen && touchCapable;
      
      // Android detection (when available)
      const isAndroid = /Android/i.test(navigator.userAgent) || 
                       (isTauri && process.platform === 'android');
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                   (isTauri && process.platform === 'ios');
      
      return {
        isMobile,
        isDesktop: !isMobile,
        isAndroid,
        isIOS,
        isTauri,
        screenSize: {
          width: screenWidth,
          height: screenHeight,
          orientation
        },
        touchCapable
      };
    }

    // Fallback detection for edge cases
    export function detectPlatformFallback(): PlatformInfo {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      return {
        isMobile,
        isDesktop: !isMobile,
        isAndroid: /android/i.test(userAgent),
        isIOS: /iphone|ipad|ipod/i.test(userAgent),
        isTauri: typeof window !== 'undefined' && '__TAURI__' in window,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        },
        touchCapable: 'ontouchstart' in window
      };
    }
    ```

    **Step 2: Create React Hook for Platform Detection**
    
    Create `src/hooks/use-platform.ts`:
    ```typescript
    import { useState, useEffect } from 'react';
    import { detectPlatform, type PlatformInfo } from '@/lib/platform-detection';

    export function usePlatform(): PlatformInfo {
      const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
        // Initialize with safe defaults for SSR
        if (typeof window === 'undefined') {
          return {
            isMobile: false,
            isDesktop: true,
            isAndroid: false,
            isIOS: false,
            isTauri: false,
            screenSize: { width: 1024, height: 768, orientation: 'landscape' },
            touchCapable: false
          };
        }
        return detectPlatform();
      });

      useEffect(() => {
        // Update platform info on mount and window resize
        const updatePlatformInfo = () => {
          setPlatformInfo(detectPlatform());
        };

        updatePlatformInfo();
        
        // Listen for orientation/resize changes
        window.addEventListener('resize', updatePlatformInfo);
        window.addEventListener('orientationchange', updatePlatformInfo);

        return () => {
          window.removeEventListener('resize', updatePlatformInfo);
          window.removeEventListener('orientationchange', updatePlatformInfo);
        };
      }, []);

      return platformInfo;
    }

    // Convenience hooks for common use cases
    export function useIsMobile(): boolean {
      const { isMobile } = usePlatform();
      return isMobile;
    }

    export function useIsDesktop(): boolean {
      const { isDesktop } = usePlatform();
      return isDesktop;
    }

    export function useScreenOrientation(): 'portrait' | 'landscape' {
      const { screenSize } = usePlatform();
      return screenSize.orientation;
    }
    ```

    **Step 3: Create Platform-Aware Component Wrapper**
    
    Create `src/components/platform-aware.tsx`:
    ```typescript
    import React from 'react';
    import { usePlatform } from '@/hooks/use-platform';

    interface PlatformAwareProps {
      children: React.ReactNode;
      mobile?: React.ReactNode;
      desktop?: React.ReactNode;
      fallback?: React.ReactNode;
    }

    export function PlatformAware({ 
      children, 
      mobile, 
      desktop, 
      fallback 
    }: PlatformAwareProps) {
      const { isMobile, isDesktop } = usePlatform();

      if (isMobile && mobile) {
        return <>{mobile}</>;
      }

      if (isDesktop && desktop) {
        return <>{desktop}</>;
      }

      if (fallback) {
        return <>{fallback}</>;
      }

      return <>{children}</>;
    }

    // Usage examples:
    // <PlatformAware 
    //   mobile={<MobileNavigation />}
    //   desktop={<DesktopNavigation />}
    // />
    ```

    **Step 4: Add CSS-based Platform Detection**
    
    Update `src/styles.css`:
    ```css
    /* Platform-specific CSS classes */
    .platform-mobile {
      /* Mobile-specific styles */
    }

    .platform-desktop {
      /* Desktop-specific styles */
    }

    /* Touch-specific styles */
    .touch-device {
      /* Styles for touch-capable devices */
    }

    .no-touch {
      /* Styles for non-touch devices */
    }

    /* Responsive breakpoints aligned with platform detection */
    @media (max-width: 768px) {
      .mobile-only {
        display: block;
      }
      .desktop-only {
        display: none;
      }
    }

    @media (min-width: 769px) {
      .mobile-only {
        display: none;
      }
      .desktop-only {
        display: block;
      }
    }
    ```

    **Step 5: Integration with App Component**
    
    Update `src/App.tsx`:
    ```typescript
    import { usePlatform } from '@/hooks/use-platform';
    import { useEffect } from 'react';

    function App() {
      const platform = usePlatform();

      useEffect(() => {
        // Add platform classes to body for CSS targeting
        document.body.classList.toggle('platform-mobile', platform.isMobile);
        document.body.classList.toggle('platform-desktop', platform.isDesktop);
        document.body.classList.toggle('touch-device', platform.touchCapable);
        document.body.classList.toggle('no-touch', !platform.touchCapable);
        document.body.classList.toggle('android', platform.isAndroid);
        
        // Log platform info for debugging
        console.log('Platform detected:', platform);
      }, [platform]);

      return (
        <div className="app">
          {/* Your app content */}
        </div>
      );
    }
    ```

    **Testing & Validation**:

    **Test 1: Desktop Detection**
    ```typescript
    // Create src/test/platform-detection.test.ts
    import { detectPlatform } from '@/lib/platform-detection';

    describe('Platform Detection', () => {
      test('detects desktop environment', () => {
        // Mock desktop environment
        Object.defineProperty(window, 'innerWidth', { value: 1024 });
        Object.defineProperty(window, 'innerHeight', { value: 768 });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 });

        const platform = detectPlatform();
        expect(platform.isDesktop).toBe(true);
        expect(platform.isMobile).toBe(false);
      });

      test('detects mobile environment', () => {
        // Mock mobile environment
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        Object.defineProperty(window, 'innerHeight', { value: 667 });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });

        const platform = detectPlatform();
        expect(platform.isMobile).toBe(true);
        expect(platform.isDesktop).toBe(false);
      });
    });
    ```

    **Test 2: Manual Testing in Browser**
    ```typescript
    // Add to any component for debugging
    const DebugPlatform = () => {
      const platform = usePlatform();
      
      return (
        <div style={{ position: 'fixed', top: 0, right: 0, background: 'yellow', padding: '10px' }}>
          <pre>{JSON.stringify(platform, null, 2)}</pre>
        </div>
      );
    };
    ```

    **Validation Criteria**:
    - [ ] Platform detection correctly identifies desktop vs mobile
    - [ ] React hook updates on window resize/orientation change
    - [ ] CSS classes are applied correctly to body element
    - [ ] No console errors during platform detection
    - [ ] Platform info is logged correctly in browser console

    **Common Issues & Solutions**:
    - **Issue**: "Platform detection inconsistent"
      - **Solution**: Use multiple detection methods and fallbacks
    - **Issue**: "Hook causes infinite re-renders"
      - **Solution**: Debounce resize events and use proper dependency arrays
    - **Issue**: "SSR hydration mismatch"
      - **Solution**: Use safe defaults and update after hydration

    _Requirements: 2.1, 6.1_

  - [ ] 3.2 Add Rust-side platform detection commands
    - Create Tauri commands to provide device information and platform capabilities
    - Implement device info structure with screen size, touch capability, and platform type
    - _Requirements: 8.1, 8.5_

- [ ] 4. Create Mobile-Responsive UI Foundation
  - [ ] 4.1 Implement responsive layout system
    - Create mobile-first CSS breakpoints and responsive utility classes
    - Update Tailwind configuration with mobile-specific design tokens and spacing
    - _Requirements: 2.1, 2.2_

  - [ ] 4.2 Build mobile navigation component

    **Navigation Pattern Analysis**:
    
    **Current Desktop Navigation**: Examine existing navigation in `src/components/shell.tsx` or similar.
    
    **Mobile Navigation Options**:

    **Option A: Bottom Tab Navigation (Recommended for Primary Navigation)**
    - **Pros**: Thumb-friendly, standard mobile pattern, always visible
    - **Cons**: Limited space (max 5 tabs), takes screen real estate
    - **Best for**: Main app sections (Dashboard, Holdings, Transactions, Settings)

    **Option B: Hamburger Menu + Drawer**
    - **Pros**: More navigation options, familiar pattern
    - **Cons**: Hidden by default, requires extra tap
    - **Best for**: Secondary navigation, settings, less-used features

    **Option C: Hybrid Approach (Recommended)**
    - Bottom tabs for main sections + hamburger for secondary options

    **Implementation Plan**:

    **Step 1: Create Mobile Navigation Types**
    
    Create `src/types/navigation.ts`:
    ```typescript
    import { LucideIcon } from 'lucide-react';

    export interface NavigationItem {
      id: string;
      label: string;
      icon: LucideIcon;
      route: string;
      badge?: number;
      disabled?: boolean;
    }

    export interface NavigationSection {
      title: string;
      items: NavigationItem[];
    }

    export interface MobileNavigationProps {
      currentRoute: string;
      onNavigate: (route: string) => void;
      items: NavigationItem[];
    }
    ```

    **Step 2: Create Bottom Tab Navigation Component**
    
    Create `src/components/mobile/bottom-navigation.tsx`:
    ```typescript
    import React from 'react';
    import { cn } from '@/lib/utils';
    import { NavigationItem } from '@/types/navigation';

    interface BottomNavigationProps {
      items: NavigationItem[];
      currentRoute: string;
      onNavigate: (route: string) => void;
    }

    export function BottomNavigation({ 
      items, 
      currentRoute, 
      onNavigate 
    }: BottomNavigationProps) {
      // Limit to 5 items for optimal mobile UX
      const displayItems = items.slice(0, 5);

      return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
          <div className="flex items-center justify-around h-16">
            {displayItems.map((item) => {
              const isActive = currentRoute === item.route;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  disabled={item.disabled}
                  className={cn(
                    // Base styles - ensure 44px minimum touch target
                    "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg transition-colors",
                    // Active state
                    isActive && "text-blue-600 bg-blue-50",
                    // Inactive state
                    !isActive && "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    // Disabled state
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon size={20} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      );
    }
    ```

    **Step 3: Create Mobile Header Component**
    
    Create `src/components/mobile/mobile-header.tsx`:
    ```typescript
    import React from 'react';
    import { ArrowLeft, MoreVertical } from 'lucide-react';
    import { cn } from '@/lib/utils';

    export interface HeaderAction {
      icon: React.ComponentType<{ size?: number }>;
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }

    interface MobileHeaderProps {
      title: string;
      showBack?: boolean;
      onBack?: () => void;
      actions?: HeaderAction[];
      className?: string;
    }

    export function MobileHeader({ 
      title, 
      showBack = false, 
      onBack, 
      actions = [],
      className 
    }: MobileHeaderProps) {
      return (
        <header className={cn(
          "sticky top-0 z-50 bg-white border-b border-gray-200 safe-area-pt",
          className
        )}>
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left side - Back button or spacer */}
            <div className="flex items-center min-w-[44px]">
              {showBack && onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
            </div>

            {/* Center - Title */}
            <h1 className="text-lg font-semibold text-gray-900 truncate px-4">
              {title}
            </h1>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 min-w-[44px] justify-end">
              {actions.slice(0, 2).map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label={action.label}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
              
              {/* More actions menu if > 2 actions */}
              {actions.length > 2 && (
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="More actions"
                >
                  <MoreVertical size={20} />
                </button>
              )}
            </div>
          </div>
        </header>
      );
    }
    ```

    **Step 4: Create Navigation Configuration**
    
    Create `src/config/mobile-navigation.ts`:
    ```typescript
    import { 
      Home, 
      TrendingUp, 
      Receipt, 
      PieChart, 
      Settings,
      User,
      FileText
    } from 'lucide-react';
    import { NavigationItem } from '@/types/navigation';

    // Primary navigation items (bottom tabs)
    export const primaryNavigation: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        route: '/'
      },
      {
        id: 'holdings',
        label: 'Holdings',
        icon: PieChart,
        route: '/holdings'
      },
      {
        id: 'transactions',
        label: 'Activity',
        icon: Receipt,
        route: '/activities'
      },
      {
        id: 'performance',
        label: 'Performance',
        icon: TrendingUp,
        route: '/performance'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        route: '/settings'
      }
    ];

    // Secondary navigation items (drawer/menu)
    export const secondaryNavigation: NavigationItem[] = [
      {
        id: 'accounts',
        label: 'Accounts',
        icon: User,
        route: '/accounts'
      },
      {
        id: 'income',
        label: 'Income',
        icon: FileText,
        route: '/income'
      }
    ];
    ```

    **Step 5: Integrate with Main App Layout**
    
    Update `src/components/shell.tsx` or create `src/components/mobile/mobile-layout.tsx`:
    ```typescript
    import React from 'react';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { BottomNavigation } from './bottom-navigation';
    import { MobileHeader } from './mobile-header';
    import { primaryNavigation } from '@/config/mobile-navigation';
    import { useIsMobile } from '@/hooks/use-platform';

    interface MobileLayoutProps {
      children: React.ReactNode;
      title?: string;
      showBack?: boolean;
      headerActions?: HeaderAction[];
    }

    export function MobileLayout({ 
      children, 
      title = 'Wealthfolio',
      showBack = false,
      headerActions = []
    }: MobileLayoutProps) {
      const location = useLocation();
      const navigate = useNavigate();
      const isMobile = useIsMobile();

      if (!isMobile) {
        // Return desktop layout or redirect
        return <>{children}</>;
      }

      const handleNavigate = (route: string) => {
        navigate(route);
      };

      const handleBack = () => {
        navigate(-1);
      };

      return (
        <div className="flex flex-col h-screen bg-gray-50">
          <MobileHeader 
            title={title}
            showBack={showBack}
            onBack={handleBack}
            actions={headerActions}
          />
          
          <main className="flex-1 overflow-auto pb-16">
            {children}
          </main>
          
          <BottomNavigation
            items={primaryNavigation}
            currentRoute={location.pathname}
            onNavigate={handleNavigate}
          />
        </div>
      );
    }
    ```

    **Step 6: Add Safe Area Support**
    
    Update `src/styles.css`:
    ```css
    /* Safe area support for mobile devices */
    .safe-area-pt {
      padding-top: env(safe-area-inset-top);
    }

    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom);
    }

    .safe-area-pl {
      padding-left: env(safe-area-inset-left);
    }

    .safe-area-pr {
      padding-right: env(safe-area-inset-right);
    }

    /* Ensure content doesn't hide behind navigation */
    .mobile-content {
      padding-bottom: calc(4rem + env(safe-area-inset-bottom));
    }
    ```

    **Testing & Validation**:

    **Test 1: Touch Target Size**
    ```typescript
    // Add to any test file
    test('navigation buttons meet minimum touch target size', () => {
      render(<BottomNavigation items={primaryNavigation} currentRoute="/" onNavigate={jest.fn()} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = getComputedStyle(button);
        const minWidth = parseInt(styles.minWidth);
        const minHeight = parseInt(styles.minHeight);
        
        expect(minWidth).toBeGreaterThanOrEqual(44);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
    ```

    **Test 2: Manual Testing Checklist**
    - [ ] Bottom navigation is visible and accessible
    - [ ] Touch targets are at least 44px × 44px
    - [ ] Active state is clearly visible
    - [ ] Navigation works correctly between screens
    - [ ] Header back button functions properly
    - [ ] Safe area insets are respected on devices with notches

    **Validation Criteria**:
    - [ ] Bottom navigation renders without errors
    - [ ] All navigation items are clickable and properly sized
    - [ ] Active state correctly highlights current route
    - [ ] Header component displays title and actions correctly
    - [ ] Back navigation works as expected
    - [ ] Layout adapts to different screen sizes
    - [ ] Safe area insets are properly handled

    **Common Issues & Solutions**:
    - **Issue**: "Navigation hidden behind content"
      - **Solution**: Add proper padding-bottom to main content area
    - **Issue**: "Touch targets too small"
      - **Solution**: Ensure min-width and min-height are at least 44px
    - **Issue**: "Safe area not respected"
      - **Solution**: Use CSS env() variables for safe area insets

    _Requirements: 2.3, 8.3_

  - [ ] 4.3 Create mobile-optimized layout components
    - Build responsive container components that adapt to mobile screen sizes
    - Implement mobile-friendly sidebar/drawer component for secondary navigation
    - _Requirements: 2.1, 2.4_

### Phase 1 Checkpoint: Validate Foundation
**Before proceeding to Phase 2, ensure**:
- [ ] Initial test APK (Task 2.4) successfully installs and launches
- [ ] Basic mobile navigation works correctly
- [ ] Platform detection accurately identifies mobile environment
- [ ] No critical Tauri Mobile compatibility issues discovered

## Phase 2: Core Features

- [ ] 5. Adapt Core UI Components for Mobile
  - [ ] 5.1 Create mobile data display components
    - **Priority**: Implement mobile card view as primary data display method
    - Build simplified mobile-friendly list components for transactions and holdings
    - **Fallback**: Create basic responsive table only if card view is insufficient
    - _Requirements: 2.2, 2.4, 3.1_

  - [ ] 5.2 Optimize form components for mobile
    - Enhance form inputs with proper mobile keyboard types and validation
    - Create mobile-friendly date pickers, dropdowns, and multi-select components
    - _Requirements: 2.2, 3.2, 8.1_

  - [ ] 5.3 Adapt chart components for mobile
    - Modify Recharts components to be touch-responsive with proper mobile interactions
    - Implement mobile-optimized chart legends and tooltips
    - _Requirements: 2.4, 3.3_

- [ ] 6. Implement Mobile-Specific Features
  - [ ] 6.1 Add touch gesture support
    - Implement swipe gestures for navigation and data manipulation
    - Add pull-to-refresh functionality for data lists and portfolio updates
    - _Requirements: 2.4, 8.5_

  - [ ] 6.2 Handle Android permissions and lifecycle
    - Create Tauri commands for requesting and managing Android permissions
    - Implement proper app lifecycle handling for background/foreground transitions
    - _Requirements: 5.3, 7.3, 8.2_

  - [ ] 6.3 Implement mobile file operations
    - Adapt file import/export functionality for Android file system and permissions
    - Create mobile-friendly file picker and sharing integration
    - _Requirements: 3.4, 4.4, 8.1_

- [ ] 7. Adapt Core Application Features
  - [ ] 7.1 Mobile portfolio dashboard
    - Adapt main dashboard layout for mobile screens with collapsible sections
    - Implement mobile-optimized portfolio summary cards and quick actions
    - _Requirements: 1.2, 2.1, 3.1_

  - [ ] 7.2 Mobile account management
    - Create mobile-friendly account creation and editing forms
    - Implement mobile account list with swipe actions for quick operations
    - _Requirements: 3.1, 3.2_

  - [ ] 7.3 Mobile transaction management
    - Adapt transaction entry forms for mobile with optimized input flow
    - Create mobile transaction list with filtering and search capabilities
    - _Requirements: 3.2, 3.3_

  - [ ] 7.4 Mobile holdings and performance views
    - Implement mobile-optimized holdings list with expandable details
    - Create mobile performance charts with touch interactions and zoom capabilities
    - _Requirements: 3.1, 3.3_

  - [ ] 7.5 Generate feature-complete test APK
    - Build APK with all core features implemented for comprehensive mobile testing
    - Create testing checklist for validating all major app functionality on mobile
    - _Requirements: 1.1, 3.1, 3.2, 3.3_

### Phase 2 Checkpoint: Validate Core Features
**Before proceeding to Phase 3, ensure**:
- [ ] Feature-complete test APK (Task 7.5) demonstrates all core functionality
- [ ] Portfolio data displays correctly on mobile screens
- [ ] Basic transaction entry and account management work
- [ ] Performance is acceptable for core use cases
- [ ] No data corruption or major stability issues

## Phase 3: Enhancement & Polish

- [ ] 8. Database and Storage Optimization
  - [ ] 8.1 Optimize SQLite for mobile
    - Configure SQLite settings for mobile performance and battery efficiency
    - Implement database connection pooling optimized for mobile resource constraints
    - _Requirements: 4.1, 5.1_

  - [ ] 8.2 Implement simplified data backup/restore
    - Create data export functionality to generate backup files
    - Implement data import functionality to restore from backup files
    - **Note**: Focus on backup/restore rather than complex synchronization
    - _Requirements: 4.2, 4.3_

  - [ ] 8.3 Add mobile-specific data persistence
    - Implement secure storage for sensitive settings using Android Keystore
    - Create mobile settings management with device-specific preferences
    - _Requirements: 4.1, 4.3_

- [ ] 9. Performance Optimization for Mobile
  - [ ] 9.1 Implement code splitting and lazy loading
    - Add route-based code splitting to reduce initial bundle size
    - Implement lazy loading for heavy components like charts and data tables
    - _Requirements: 5.1, 5.4_

  - [ ] 9.2 Optimize bundle size and assets
    - Configure Vite build optimization for mobile with tree shaking and minification
    - Optimize images and assets for mobile screen densities
    - _Requirements: 5.1, 5.4_

  - [ ] 9.3 Add performance monitoring
    - Implement performance metrics collection for mobile-specific bottlenecks
    - Create mobile performance testing utilities and benchmarks
    - _Requirements: 5.1, 5.2_

- [ ] 10. Testing Infrastructure for Mobile
  - [ ] 10.1 Setup mobile testing environment
    - Configure Jest and React Testing Library for mobile component testing
    - Setup Android emulator testing pipeline with different screen sizes and API levels
    - _Requirements: 1.1, 2.1_

  - [ ] 10.2 Create mobile-specific test suites
    - Write unit tests for mobile UI components and responsive behavior
    - Create integration tests for mobile-specific features like gestures and permissions
    - _Requirements: 2.2, 2.4, 8.1_

  - [ ] 10.3 Implement basic mobile testing
    - Setup manual testing procedures for core user flows on Android emulators
    - Create basic performance monitoring for load time and memory usage
    - **Note**: Focus on manual testing initially, automate later if needed
    - _Requirements: 1.1, 5.1_

  - [ ] 10.4 Generate optimized test APK
    - Build performance-optimized APK for testing mobile-specific optimizations
    - Create performance benchmarking guide for testing on various Android devices
    - _Requirements: 5.1, 5.4, 1.1_

- [ ] 11. Error Handling and Recovery
  - [ ] 11.1 Implement mobile-specific error handling
    - Create error boundary components optimized for mobile error display
    - Implement graceful degradation for mobile-specific failures
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 11.2 Add offline capability and recovery
    - Implement offline detection and appropriate user feedback
    - Create data recovery mechanisms for interrupted operations
    - _Requirements: 5.2, 5.3_

- [ ] 12. Security and Privacy Implementation
  - [ ] 12.1 Implement mobile security measures
    - Add SQLite database encryption for mobile storage
    - Implement secure API key storage using Android Keystore
    - _Requirements: 4.1, 4.3_

  - [ ] 12.2 Handle mobile privacy requirements
    - Implement privacy-compliant data handling for Android
    - Create user controls for data export and deletion
    - _Requirements: 4.4, 4.5_

- [ ] 13. Final Integration and Polish
  - [ ] 13.1 Complete mobile UI polish
    - Refine mobile animations, transitions, and micro-interactions
    - Implement mobile-specific loading states and feedback mechanisms
    - _Requirements: 2.4, 8.5_

  - [ ] 13.2 Comprehensive mobile testing
    - Execute full test suite across different Android devices and versions
    - Perform user acceptance testing with mobile-specific scenarios
    - _Requirements: 1.1, 1.4_

  - [ ] 13.3 Generate personal-use APK
    - Generate signed APK with proper Android app signing configuration for personal installation
    - Create installation guide and personal usage documentation
    - _Requirements: 7.1, 7.4, 7.5_

  - [ ] 13.4 Create final personal APK package
    - Build final APK with all features, optimizations, and polish for personal use
    - Package APK with installation instructions and personal usage guidelines
    - _Requirements: 1.1, 7.1, 7.4_

### Phase 3 Completion: Final Validation
**Project completion criteria**:
- [ ] Final personal APK (Task 13.4) ready for daily use
- [ ] Performance meets personal usage requirements
- [ ] Data backup/restore functionality verified
- [ ] Installation and usage documentation complete
- [ ] All critical bugs resolved

## Risk Management

### High-Risk Tasks (Monitor Closely)
- **Task 1**: Tauri Mobile validation - **Critical path dependency**
- **Task 5.1**: Mobile data display - **Core functionality**
- **Task 7.1**: Portfolio dashboard - **Primary user interface**
- **Task 8.2**: Data backup/restore - **Data safety**

### Fallback Options
- **If Tauri Mobile is unstable**: Consider Capacitor + React approach
- **If UI adaptation is too complex**: Implement simplified mobile-only views
- **If performance is poor**: Reduce feature scope and optimize core functions
- **If data sync is problematic**: Focus on single-device usage with export/import

### Success Metrics
- **Phase 1**: APK installs and basic navigation works
- **Phase 2**: Can view portfolio and add transactions on mobile
- **Phase 3**: Daily usage without significant issues

## Development Guidelines for New Graduates

### Essential Development Principles

1. **Mobile-First Approach**
   - Always design for mobile screens first (320px-428px width)
   - Use touch-friendly interactions (minimum 44px touch targets)
   - Test on actual devices, not just browser dev tools

2. **Progressive Enhancement**
   - Start with basic functionality, add advanced features later
   - Ensure core features work before adding animations/gestures
   - Always have fallbacks for failed operations

3. **Performance Considerations**
   - Mobile devices have limited resources
   - Lazy load heavy components and data
   - Minimize bundle size and optimize images

### Common Development Patterns

**Pattern 1: Conditional Rendering Based on Platform**
```typescript
const { isMobile } = usePlatform();

return (
  <>
    {isMobile ? (
      <MobileComponent />
    ) : (
      <DesktopComponent />
    )}
  </>
);
```

**Pattern 2: Responsive Component Props**
```typescript
<DataTable 
  variant={isMobile ? 'cards' : 'table'}
  itemsPerPage={isMobile ? 10 : 25}
  showFilters={!isMobile}
/>
```

**Pattern 3: Touch-Optimized Event Handling**
```typescript
const handleTouch = useCallback((e: TouchEvent) => {
  // Handle touch-specific logic
  e.preventDefault(); // Prevent default browser behavior
}, []);

useEffect(() => {
  if (isMobile) {
    element.addEventListener('touchstart', handleTouch);
    return () => element.removeEventListener('touchstart', handleTouch);
  }
}, [isMobile, handleTouch]);
```

### Debugging and Testing Strategies

**Strategy 1: Browser DevTools Mobile Simulation**
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone, Pixel, etc.)
4. Test touch interactions and responsive design
```

**Strategy 2: Android Emulator Testing**
```bash
# Start emulator
emulator -avd Pixel_7_API_33

# Install and test APK
adb install path/to/your.apk
adb logcat | grep "YourApp"  # View logs
```

**Strategy 3: Real Device Testing**
```bash
# Enable USB debugging on Android device
# Connect via USB
adb devices  # Verify device connection
adb install your.apk
```

### Troubleshooting Common Issues

**Issue: "Tauri commands not working on mobile"**
```typescript
// Solution: Add proper error handling and fallbacks
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      if (window.__TAURI__) {
        const result = await invoke('your_command');
        setData(result);
      } else {
        // Fallback for non-Tauri environments
        console.warn('Tauri not available, using fallback');
        setData(mockData);
      }
    } catch (err) {
      setError(err);
      console.error('Command failed:', err);
    }
  };

  fetchData();
}, []);
```

**Issue: "UI components too small on mobile"**
```css
/* Solution: Use proper touch target sizes */
.mobile-button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
  font-size: 16px; /* Prevent zoom on iOS */
}

.mobile-input {
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
  padding: 12px;
}
```

**Issue: "App crashes on Android startup"**
```rust
// Solution: Add proper error handling in Rust
#[tauri::command]
async fn your_command() -> Result<String, String> {
    match risky_operation() {
        Ok(result) => Ok(result),
        Err(e) => {
            eprintln!("Error in your_command: {}", e);
            Err(format!("Operation failed: {}", e))
        }
    }
}
```

**Issue: "Performance issues on mobile"**
```typescript
// Solution: Implement proper loading states and optimization
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={60}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <ListItem item={data[index]} />
      </div>
    )}
  </List>
);
```

### Code Quality Standards

**1. TypeScript Usage**
- Always use TypeScript for type safety
- Define interfaces for all data structures
- Use proper error types and handling

**2. Component Structure**
```typescript
// Good component structure
interface ComponentProps {
  // Define all props with types
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**3. Error Boundaries**
```typescript
// Always wrap components in error boundaries
class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mobile component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Resources and Documentation

**Essential Reading**:
- [Tauri Mobile Guide](https://tauri.app/v1/guides/building/mobile)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Android Design Guidelines](https://material.io/design)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

**Useful Tools**:
- Chrome DevTools for mobile simulation
- Android Studio for emulator and debugging
- React DevTools for component inspection
- Flipper for advanced mobile debugging

**When to Ask for Help**:
- Tauri-specific errors that aren't documented
- Performance issues that can't be resolved with standard optimization
- Android-specific crashes or compatibility issues
- Complex state management problems

Remember: It's better to ask questions early than to spend hours debugging. Document your solutions for future reference!