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

  **Step 2: Install macOS Development Prerequisites**
  ```bash
  # Install Xcode command line tools (required for Rust toolchain)
  xcode-select --install
  
  # Verify installation
  xcode-select -p
  # Should output: /Applications/Xcode.app/Contents/Developer
  ```

  **Step 3: Configure Android SDK Environment**
  ```bash
  # Add to ~/.zshrc or ~/.bash_profile:
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

  # Reload shell configuration
  source ~/.zshrc
  ```

  **Step 4: Install Required Android Components**
  ```bash
  # CRITICAL: Accept all Android SDK licenses first
  sdkmanager --licenses
  # Type 'y' for each license prompt - this is a common tripping point!
  
  # Install Android SDK components
  sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
  sdkmanager "system-images;android-33;google_apis;arm64-v8a"  # For Apple Silicon
  # OR for Intel Macs:
  # sdkmanager "system-images;android-33;google_apis;x86_64"
  
  # Verify installation
  sdkmanager --list_installed
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
          "versionCode": 116,  // CRITICAL: Must increment for EVERY build/update
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

    **CRITICAL: Version Code Management**
    
    The `versionCode` is Android's internal version number and **MUST be incremented** for every single build intended for testing or release:
    
    ```json
    {
      "mobile": {
        "android": {
          "versionCode": 116,  // Current: 1.1.6 -> 116
          // Next build should be 117, then 118, etc.
        }
      }
    }
    ```
    
    **Version Code Rules**:
    - Android uses this to determine if an app is an upgrade
    - Must be higher than previous version for updates to work
    - Cannot be decreased once published
    - Recommended format: Major.Minor.Patch -> MajorMinorPatch (e.g., 1.1.6 -> 116)

    **Common Configuration Issues**:

    - **Issue**: "Invalid SDK version"
      - **Solution**: Ensure minSdkVersion ≤ targetSdkVersion ≤ compileSdkVersion
    - **Issue**: "Permission denied" errors
      - **Solution**: Add required permissions to the permissions array
    - **Issue**: "App crashes on startup"
      - **Solution**: Check theme compatibility and remove desktop-specific settings
    - **Issue**: "App won't update/install"
      - **Solution**: Check that versionCode is higher than previous build

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

  - [ ] 2.4 Generate initial test APK with mobile validation

    **Step 1: Create Mobile-Only Validation Page**
    
    Create `src/pages/mobile-hello.tsx` - a simple page that only loads on mobile:
    ```typescript
    import React from 'react';
    import { useIsMobile } from '@/hooks/use-platform';

    export function MobileHelloPage() {
      const isMobile = useIsMobile();

      if (!isMobile) {
        return (
          <div className="p-4 text-center">
            <h2>This page is mobile-only</h2>
            <p>Please access from a mobile device or resize your browser</p>
          </div>
        );
      }

      return (
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold text-center">🎉 Mobile Build Success!</h1>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="font-semibold text-green-800">Platform Detection Working</h2>
            <p className="text-green-700">This page confirms:</p>
            <ul className="list-disc list-inside text-green-700 mt-2">
              <li>Tauri mobile build is functional</li>
              <li>Platform detection is working</li>
              <li>React components render correctly</li>
              <li>Mobile-specific routing is operational</li>
            </ul>
          </div>

          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Next Steps</h3>
            <p className="text-blue-700">
              Once you see this page on your Android device, you can proceed to implement 
              the full mobile UI components.
            </p>
          </div>

          <button 
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold"
            onClick={() => alert('Touch interaction working!')}
          >
            Test Touch Interaction
          </button>
        </div>
      );
    }
    ```

    **Step 2: Add Mobile Route**
    
    Update `src/routes.tsx` to include the mobile validation route:
    ```typescript
    import { MobileHelloPage } from '@/pages/mobile-hello';

    // Add to your routes configuration
    {
      path: '/mobile-hello',
      element: <MobileHelloPage />
    }
    ```

    **Step 3: Build Debug APK**
    ```bash
    # Build for Android development
    cargo tauri android dev
    
    # If dev build fails, try building release APK
    cargo tauri android build --debug
    ```

    **Step 4: Install and Test APK**
    ```bash
    # Find the generated APK (usually in src-tauri/gen/android/app/build/outputs/apk/)
    find . -name "*.apk" -type f
    
    # Install on connected device or emulator
    adb install path/to/your-debug.apk
    
    # Launch the app and navigate to /mobile-hello
    # You should see the validation page confirming mobile build success
    ```

    **Step 5: Document Installation Process**
    
    Create `MOBILE_TESTING.md`:
    ```markdown
    # Mobile Testing Guide

    ## APK Installation
    1. Enable "Unknown Sources" in Android Settings > Security
    2. Transfer APK to device via USB/email/cloud storage
    3. Tap APK file to install
    4. Grant necessary permissions when prompted

    ## Testing Checklist
    - [ ] App launches without crashes
    - [ ] Navigate to /mobile-hello route
    - [ ] Validation page displays correctly
    - [ ] Touch interaction button works
    - [ ] No console errors in browser dev tools (if using webview debugging)

    ## Debugging
    - Enable USB debugging on Android device
    - Use `adb logcat` to view app logs
    - Use Chrome DevTools for webview debugging: chrome://inspect
    ```

    **Validation Criteria**:
    - [ ] APK builds successfully without errors
    - [ ] APK installs on Android device/emulator
    - [ ] App launches and displays mobile validation page
    - [ ] Touch interactions work correctly
    - [ ] Platform detection correctly identifies mobile environment
    - [ ] No critical errors in application logs

    **Expected Issues & Solutions**:
    - **Issue**: "App crashes on startup"
      - **Solution**: Check Android logs with `adb logcat | grep -i error`
    - **Issue**: "APK won't install"
      - **Solution**: Enable "Install unknown apps" for your file manager
    - **Issue**: "Blank screen on launch"
      - **Solution**: Check that mobile route is properly configured

    _Requirements: 7.1, 1.1_

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
  - [ ] 5.1 Create NEW mobile-specific data display components

    **DIRECTIVE: Do NOT adapt existing desktop components. Create new, mobile-first components.**

    **Step 1: Create Mobile Transaction Card Component**
    
    Create `src/components/mobile/mobile-transaction-card.tsx`:
    ```typescript
    import React, { useState } from 'react';
    import { ChevronDown, ChevronUp } from 'lucide-react';
    import { Activity } from '@/lib/types';

    interface MobileTransactionCardProps {
      transaction: Activity;
      onEdit?: (transaction: Activity) => void;
      onDelete?: (transaction: Activity) => void;
    }

    export function MobileTransactionCard({ 
      transaction, 
      onEdit, 
      onDelete 
    }: MobileTransactionCardProps) {
      const [isExpanded, setIsExpanded] = useState(false);

      return (
        <div className="bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden">
          {/* Summary View - Always Visible */}
          <div 
            className="p-4 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {transaction.symbol}
                  </h3>
                  <span className={`text-sm font-medium ${
                    transaction.activityType === 'BUY' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.activityType}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">
                    {transaction.quantity} shares
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${transaction.unitPrice?.toFixed(2)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(transaction.activityDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="ml-3">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>

          {/* Expanded Details - Show on Tap */}
          {isExpanded && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{transaction.accountId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">
                    ${(transaction.quantity * (transaction.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
                {transaction.fee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">${transaction.fee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(transaction);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(transaction);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    ```

    **Step 2: Create Mobile Holdings Card Component**
    
    Create `src/components/mobile/mobile-holding-card.tsx`:
    ```typescript
    import React from 'react';
    import { TrendingUp, TrendingDown } from 'lucide-react';
    import { Holding } from '@/lib/types';

    interface MobileHoldingCardProps {
      holding: Holding;
      onTap?: (holding: Holding) => void;
    }

    export function MobileHoldingCard({ holding, onTap }: MobileHoldingCardProps) {
      const gainLoss = holding.marketValue - holding.bookValue;
      const gainLossPercent = (gainLoss / holding.bookValue) * 100;
      const isPositive = gainLoss >= 0;

      return (
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-pointer active:bg-gray-50"
          onClick={() => onTap?.(holding)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{holding.symbol}</h3>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${holding.marketValue.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium flex items-center ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="ml-1">
                      {isPositive ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>{holding.quantity} shares</span>
                <span>Avg: ${holding.averagePrice?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ```

    **Step 3: Create Mobile List Container**
    
    Create `src/components/mobile/mobile-list-container.tsx`:
    ```typescript
    import React from 'react';
    import { Loader2 } from 'lucide-react';

    interface MobileListContainerProps {
      children: React.ReactNode;
      loading?: boolean;
      empty?: boolean;
      emptyMessage?: string;
      title?: string;
    }

    export function MobileListContainer({ 
      children, 
      loading, 
      empty, 
      emptyMessage = 'No items found',
      title 
    }: MobileListContainerProps) {
      if (loading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={24} />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        );
      }

      if (empty) {
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-gray-600">
              Data will appear here once available
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 px-4 py-2">
              {title}
            </h2>
          )}
          <div className="px-4">
            {children}
          </div>
        </div>
      );
    }
    ```

    **Step 4: Integration Example**
    
    Create `src/pages/mobile/mobile-transactions.tsx`:
    ```typescript
    import React from 'react';
    import { MobileTransactionCard } from '@/components/mobile/mobile-transaction-card';
    import { MobileListContainer } from '@/components/mobile/mobile-list-container';
    import { useActivities } from '@/hooks/use-activities';

    export function MobileTransactionsPage() {
      const { data: activities, isLoading } = useActivities();

      return (
        <MobileListContainer 
          loading={isLoading}
          empty={!activities?.length}
          emptyMessage="No transactions found"
          title="Recent Transactions"
        >
          {activities?.map((activity) => (
            <MobileTransactionCard
              key={activity.id}
              transaction={activity}
              onEdit={(transaction) => {
                // Handle edit
                console.log('Edit transaction:', transaction);
              }}
              onDelete={(transaction) => {
                // Handle delete
                console.log('Delete transaction:', transaction);
              }}
            />
          ))}
        </MobileListContainer>
      );
    }
    ```

    **Design Principles for Mobile Cards**:
    1. **Touch-First**: 44px minimum touch targets, generous padding
    2. **Summary + Details**: Show essential info by default, expand for details
    3. **Visual Hierarchy**: Use typography and color to guide attention
    4. **Performance**: Virtualize long lists, lazy load images
    5. **Accessibility**: Proper ARIA labels, keyboard navigation

    **Validation Criteria**:
    - [ ] Cards display essential information without expansion
    - [ ] Tap to expand reveals additional details
    - [ ] Touch targets are minimum 44px × 44px
    - [ ] Cards work well in lists of 100+ items
    - [ ] Loading and empty states are handled gracefully
    - [ ] Components are reusable across different data types

    **DO NOT**:
    - ❌ Try to make desktop tables responsive
    - ❌ Use small fonts or cramped layouts
    - ❌ Implement complex hover states (no hover on mobile)
    - ❌ Create components that require horizontal scrolling

    _Requirements: 2.2, 2.4, 3.1_

  - [ ] 5.2 Create mobile-optimized form components

    **Step 1: Investigate and Choose Mobile Date Picker**
    
    **Analysis of Date Picker Options**:
    
    **Option A: Native Browser Date Input (Recommended for MVP)**
    ```typescript
    // Pros: Native, consistent with OS, no extra dependencies
    // Cons: Limited styling, inconsistent across browsers
    
    <input 
      type="date" 
      className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base"
      // text-base prevents zoom on iOS
    />
    ```

    **Option B: React Aria Components (Recommended for Production)**
    ```typescript
    // Already in package.json, provides consistent mobile experience
    import { DatePicker } from 'react-aria-components';
    
    // Pros: Consistent styling, accessible, touch-optimized
    // Cons: Larger bundle size, more complex implementation
    ```

    **Option C: Custom Mobile Date Picker**
    ```typescript
    // Pros: Full control, optimized for touch
    // Cons: High development time, potential accessibility issues
    ```

    **DIRECTIVE: Start with Option A (native), upgrade to Option B if needed.**

    **Step 2: Create Mobile Form Input Component**
    
    Create `src/components/mobile/mobile-form-input.tsx`:
    ```typescript
    import React, { forwardRef } from 'react';
    import { cn } from '@/lib/utils';

    interface MobileFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
      label: string;
      error?: string;
      helperText?: string;
      icon?: React.ComponentType<{ size?: number }>;
    }

    export const MobileFormInput = forwardRef<HTMLInputElement, MobileFormInputProps>(
      ({ label, error, helperText, icon: Icon, className, ...props }, ref) => {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="relative">
              {Icon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon size={20} />
                </div>
              )}
              
              <input
                ref={ref}
                className={cn(
                  // Base styles - CRITICAL: 16px font size prevents iOS zoom
                  "w-full h-12 px-4 border border-gray-300 rounded-lg text-base bg-white",
                  "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "disabled:bg-gray-100 disabled:text-gray-500",
                  // Add left padding if icon present
                  Icon && "pl-10",
                  // Error state
                  error && "border-red-500 focus:ring-red-500 focus:border-red-500",
                  className
                )}
                {...props}
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            
            {helperText && !error && (
              <p className="text-sm text-gray-600">{helperText}</p>
            )}
          </div>
        );
      }
    );
    ```

    **Step 3: Create Mobile Date Picker Component**
    
    Create `src/components/mobile/mobile-date-picker.tsx`:
    ```typescript
    import React from 'react';
    import { Calendar } from 'lucide-react';
    import { MobileFormInput } from './mobile-form-input';

    interface MobileDatePickerProps {
      label: string;
      value?: string;
      onChange: (date: string) => void;
      error?: string;
      required?: boolean;
      min?: string;
      max?: string;
    }

    export function MobileDatePicker({ 
      label, 
      value, 
      onChange, 
      error, 
      required,
      min,
      max 
    }: MobileDatePickerProps) {
      return (
        <MobileFormInput
          type="date"
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={required}
          min={min}
          max={max}
          icon={Calendar}
          // CRITICAL: Prevent iOS zoom with 16px font size
          style={{ fontSize: '16px' }}
        />
      );
    }
    ```

    **Step 4: Create Mobile Select Component**
    
    Create `src/components/mobile/mobile-select.tsx`:
    ```typescript
    import React from 'react';
    import { ChevronDown } from 'lucide-react';
    import { cn } from '@/lib/utils';

    interface MobileSelectProps {
      label: string;
      value?: string;
      onChange: (value: string) => void;
      options: { value: string; label: string }[];
      error?: string;
      required?: boolean;
      placeholder?: string;
    }

    export function MobileSelect({ 
      label, 
      value, 
      onChange, 
      options, 
      error, 
      required,
      placeholder = 'Select an option'
    }: MobileSelectProps) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={cn(
                // Base styles - CRITICAL: 16px font size prevents iOS zoom
                "w-full h-12 px-4 pr-10 border border-gray-300 rounded-lg text-base bg-white",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "appearance-none cursor-pointer",
                // Error state
                error && "border-red-500 focus:ring-red-500 focus:border-red-500"
              )}
              style={{ fontSize: '16px' }}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown size={20} className="text-gray-400" />
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      );
    }
    ```

    **Step 5: Create Mobile Form Container**
    
    Create `src/components/mobile/mobile-form.tsx`:
    ```typescript
    import React from 'react';

    interface MobileFormProps {
      children: React.ReactNode;
      onSubmit: (e: React.FormEvent) => void;
      title?: string;
      submitLabel?: string;
      isSubmitting?: boolean;
    }

    export function MobileForm({ 
      children, 
      onSubmit, 
      title, 
      submitLabel = 'Save',
      isSubmitting = false 
    }: MobileFormProps) {
      return (
        <form onSubmit={onSubmit} className="space-y-6 p-4">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          )}
          
          <div className="space-y-4">
            {children}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      );
    }
    ```

    **Mobile Form Best Practices**:

    1. **Font Size**: Always use 16px+ to prevent iOS zoom
    2. **Touch Targets**: Minimum 44px height for all interactive elements
    3. **Keyboard Types**: Use appropriate `inputMode` and `type` attributes
    4. **Validation**: Show errors immediately below inputs
    5. **Loading States**: Disable forms during submission

    **Input Mode Examples**:
    ```typescript
    // For numbers
    <MobileFormInput type="text" inputMode="numeric" pattern="[0-9]*" />
    
    // For decimals
    <MobileFormInput type="text" inputMode="decimal" />
    
    // For email
    <MobileFormInput type="email" inputMode="email" />
    
    // For phone
    <MobileFormInput type="tel" inputMode="tel" />
    ```

    **Validation Criteria**:
    - [ ] All inputs are minimum 44px height
    - [ ] Font size is 16px or larger (prevents iOS zoom)
    - [ ] Date picker works consistently across devices
    - [ ] Form validation provides clear, immediate feedback
    - [ ] Keyboard types are appropriate for input content
    - [ ] Forms work well with device auto-fill

    _Requirements: 2.2, 3.2, 8.1_

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

    **Step 1: Create Rust Permission Commands**
    
    Add to `src-tauri/src/commands/permissions.rs`:
    ```rust
    use tauri::command;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub enum PermissionStatus {
        Granted,
        Denied,
        NotRequested,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct PermissionRequest {
        pub permission: String,
        pub rationale: Option<String>,
    }

    #[command]
    pub async fn request_permission(permission: String) -> Result<PermissionStatus, String> {
        #[cfg(target_os = "android")]
        {
            // Android-specific permission request logic
            // This will need to be implemented with Android-specific code
            match permission.as_str() {
                "android.permission.READ_EXTERNAL_STORAGE" => {
                    // Request storage permission
                    Ok(PermissionStatus::Granted) // Placeholder
                }
                "android.permission.WRITE_EXTERNAL_STORAGE" => {
                    // Request storage permission
                    Ok(PermissionStatus::Granted) // Placeholder
                }
                _ => Ok(PermissionStatus::NotRequested),
            }
        }
        
        #[cfg(not(target_os = "android"))]
        {
            // Desktop fallback - always granted
            Ok(PermissionStatus::Granted)
        }
    }

    #[command]
    pub async fn check_permission(permission: String) -> Result<PermissionStatus, String> {
        #[cfg(target_os = "android")]
        {
            // Check if permission is already granted
            // Implementation depends on Android API access
            Ok(PermissionStatus::NotRequested) // Placeholder
        }
        
        #[cfg(not(target_os = "android"))]
        {
            Ok(PermissionStatus::Granted)
        }
    }

    #[command]
    pub async fn get_required_permissions() -> Result<Vec<String>, String> {
        Ok(vec![
            "android.permission.READ_EXTERNAL_STORAGE".to_string(),
            "android.permission.WRITE_EXTERNAL_STORAGE".to_string(),
            "android.permission.INTERNET".to_string(),
        ])
    }
    ```

    **Step 2: Create usePermissions React Hook**
    
    Create `src/hooks/use-permissions.ts`:
    ```typescript
    import { useState, useEffect, useCallback } from 'react';
    import { invoke } from '@tauri-apps/api/core';

    export type PermissionStatus = 'granted' | 'denied' | 'not-requested';

    interface PermissionState {
      [permission: string]: PermissionStatus;
    }

    interface UsePermissionsReturn {
      permissions: PermissionState;
      requestPermission: (permission: string) => Promise<PermissionStatus>;
      checkPermission: (permission: string) => Promise<PermissionStatus>;
      hasPermission: (permission: string) => boolean;
      loading: boolean;
      error: string | null;
    }

    export function usePermissions(): UsePermissionsReturn {
      const [permissions, setPermissions] = useState<PermissionState>({});
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const checkPermission = useCallback(async (permission: string): Promise<PermissionStatus> => {
        try {
          const status = await invoke<PermissionStatus>('check_permission', { permission });
          setPermissions(prev => ({ ...prev, [permission]: status }));
          return status;
        } catch (err) {
          console.error('Failed to check permission:', err);
          setError(err as string);
          return 'denied';
        }
      }, []);

      const requestPermission = useCallback(async (permission: string): Promise<PermissionStatus> => {
        setLoading(true);
        setError(null);
        
        try {
          const status = await invoke<PermissionStatus>('request_permission', { permission });
          setPermissions(prev => ({ ...prev, [permission]: status }));
          return status;
        } catch (err) {
          console.error('Failed to request permission:', err);
          setError(err as string);
          return 'denied';
        } finally {
          setLoading(false);
        }
      }, []);

      const hasPermission = useCallback((permission: string): boolean => {
        return permissions[permission] === 'granted';
      }, [permissions]);

      // Check required permissions on mount
      useEffect(() => {
        const checkRequiredPermissions = async () => {
          try {
            const requiredPermissions = await invoke<string[]>('get_required_permissions');
            
            for (const permission of requiredPermissions) {
              await checkPermission(permission);
            }
          } catch (err) {
            console.error('Failed to check required permissions:', err);
          }
        };

        checkRequiredPermissions();
      }, [checkPermission]);

      return {
        permissions,
        requestPermission,
        checkPermission,
        hasPermission,
        loading,
        error
      };
    }

    // Convenience hooks for common permissions
    export function useStoragePermission() {
      const { hasPermission, requestPermission } = usePermissions();
      
      return {
        hasStoragePermission: hasPermission('android.permission.READ_EXTERNAL_STORAGE'),
        requestStoragePermission: () => requestPermission('android.permission.READ_EXTERNAL_STORAGE')
      };
    }
    ```

    **Step 3: Handle App Lifecycle Events**
    
    Create `src/hooks/use-app-lifecycle.ts`:
    ```typescript
    import { useEffect, useCallback } from 'react';
    import { listen } from '@tauri-apps/api/event';

    interface AppLifecycleCallbacks {
      onAppSuspending?: () => void;
      onAppResuming?: () => void;
      onAppVisible?: () => void;
      onAppHidden?: () => void;
    }

    export function useAppLifecycle(callbacks: AppLifecycleCallbacks) {
      const {
        onAppSuspending,
        onAppResuming,
        onAppVisible,
        onAppHidden
      } = callbacks;

      useEffect(() => {
        let unlistenSuspending: (() => void) | undefined;
        let unlistenResuming: (() => void) | undefined;

        const setupListeners = async () => {
          try {
            // Listen for app suspending (going to background)
            if (onAppSuspending) {
              unlistenSuspending = await listen('app-suspending', () => {
                console.log('App is suspending');
                onAppSuspending();
              });
            }

            // Listen for app resuming (coming to foreground)
            if (onAppResuming) {
              unlistenResuming = await listen('app-resuming', () => {
                console.log('App is resuming');
                onAppResuming();
              });
            }
          } catch (error) {
            console.error('Failed to setup app lifecycle listeners:', error);
          }
        };

        setupListeners();

        // Also listen for browser visibility API as fallback
        const handleVisibilityChange = () => {
          if (document.hidden) {
            onAppHidden?.();
          } else {
            onAppVisible?.();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          unlistenSuspending?.();
          unlistenResuming?.();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, [onAppSuspending, onAppResuming, onAppVisible, onAppHidden]);
    }

    // Convenience hook for common lifecycle patterns
    export function useAppBackgroundHandler() {
      const pauseNetworkRequests = useCallback(() => {
        // Cancel ongoing requests, pause timers
        console.log('Pausing network requests');
      }, []);

      const resumeNetworkRequests = useCallback(() => {
        // Resume requests, restart timers
        console.log('Resuming network requests');
      }, []);

      useAppLifecycle({
        onAppSuspending: pauseNetworkRequests,
        onAppResuming: resumeNetworkRequests
      });
    }
    ```

    **Step 4: Create Permission Request Component**
    
    Create `src/components/mobile/permission-request.tsx`:
    ```typescript
    import React from 'react';
    import { Shield, AlertCircle } from 'lucide-react';
    import { usePermissions } from '@/hooks/use-permissions';

    interface PermissionRequestProps {
      permission: string;
      title: string;
      description: string;
      onGranted?: () => void;
      onDenied?: () => void;
    }

    export function PermissionRequest({ 
      permission, 
      title, 
      description, 
      onGranted, 
      onDenied 
    }: PermissionRequestProps) {
      const { requestPermission, hasPermission, loading } = usePermissions();

      const handleRequest = async () => {
        const status = await requestPermission(permission);
        
        if (status === 'granted') {
          onGranted?.();
        } else {
          onDenied?.();
        }
      };

      if (hasPermission(permission)) {
        return null; // Permission already granted
      }

      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
          <div className="flex items-start space-x-3">
            <Shield className="text-blue-600 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">{title}</h3>
              <p className="text-blue-800 text-sm mt-1">{description}</p>
              
              <button
                onClick={handleRequest}
                disabled={loading}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Requesting...' : 'Grant Permission'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Pre-configured permission requests
    export function StoragePermissionRequest() {
      return (
        <PermissionRequest
          permission="android.permission.READ_EXTERNAL_STORAGE"
          title="Storage Access Required"
          description="This app needs access to your device storage to import and export portfolio data."
        />
      );
    }
    ```

    **Step 5: Integration with Main App**
    
    Update `src/App.tsx`:
    ```typescript
    import { useAppBackgroundHandler } from '@/hooks/use-app-lifecycle';
    import { usePermissions } from '@/hooks/use-permissions';
    import { StoragePermissionRequest } from '@/components/mobile/permission-request';

    function App() {
      // Handle app lifecycle
      useAppBackgroundHandler();
      
      // Check permissions
      const { hasPermission } = usePermissions();
      const hasStoragePermission = hasPermission('android.permission.READ_EXTERNAL_STORAGE');

      return (
        <div className="app">
          {/* Show permission request if needed */}
          {!hasStoragePermission && <StoragePermissionRequest />}
          
          {/* Rest of your app */}
        </div>
      );
    }
    ```

    **Register Commands in main.rs**:
    ```rust
    // Add to src-tauri/src/main.rs
    mod commands;

    .invoke_handler(tauri::generate_handler![
        // ... existing commands
        commands::permissions::request_permission,
        commands::permissions::check_permission,
        commands::permissions::get_required_permissions,
    ])
    ```

    **Validation Criteria**:
    - [ ] Permission requests work on Android devices
    - [ ] App lifecycle events are properly handled
    - [ ] Network requests pause when app is backgrounded
    - [ ] Permission state is managed correctly in React
    - [ ] Graceful fallbacks for desktop environment

    _Requirements: 5.3, 7.3, 8.2_

  - [ ] 6.3 Implement mobile file operations using Android Storage Access Framework

    **DIRECTIVE: Use Android Storage Access Framework (SAF) for modern, secure file handling**

    **Why SAF?**
    - Avoids messy `READ/WRITE_EXTERNAL_STORAGE` permissions on Android 10+
    - Provides secure, user-controlled file access
    - Works with cloud storage providers (Google Drive, Dropbox, etc.)
    - Future-proof approach aligned with Android security model

    **Step 1: Research Tauri File Plugin Options**
    
    **Option A: Use Tauri's Built-in File Dialog (Recommended)**
    ```rust
    // Check if tauri-plugin-dialog supports SAF on mobile
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    #[tauri::command]
    async fn pick_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
        let file_path = app.dialog()
            .file()
            .add_filter("CSV Files", &["csv"])
            .add_filter("All Files", &["*"])
            .pick_file()
            .await;
            
        match file_path {
            Some(path) => Ok(Some(path.to_string_lossy().to_string())),
            None => Ok(None),
        }
    }
    ```

    **Option B: Custom SAF Implementation (If needed)**
    ```rust
    // If Tauri plugin doesn't support SAF, implement custom bridge
    #[cfg(target_os = "android")]
    use jni::JNIEnv;
    
    #[tauri::command]
    async fn pick_file_saf() -> Result<Option<String>, String> {
        #[cfg(target_os = "android")]
        {
            // Custom Android SAF implementation
            // This would require writing Java/Kotlin code
            todo!("Implement SAF file picker")
        }
        
        #[cfg(not(target_os = "android"))]
        {
            // Desktop fallback
            Ok(None)
        }
    }
    ```

    **DIRECTIVE: Start with Option A. Only implement Option B if Tauri plugin is insufficient.**

    **Step 2: Create Mobile File Operations Hook**
    
    Create `src/hooks/use-mobile-files.ts`:
    ```typescript
    import { useState, useCallback } from 'react';
    import { invoke } from '@tauri-apps/api/core';
    import { save, open } from '@tauri-apps/plugin-dialog';
    import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

    interface MobileFileOperations {
      pickFile: (filters?: FileFilter[]) => Promise<string | null>;
      saveFile: (content: string, defaultName?: string) => Promise<boolean>;
      readFile: (path: string) => Promise<string>;
      shareFile: (content: string, filename: string) => Promise<boolean>;
      loading: boolean;
      error: string | null;
    }

    interface FileFilter {
      name: string;
      extensions: string[];
    }

    export function useMobileFiles(): MobileFileOperations {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const pickFile = useCallback(async (filters: FileFilter[] = []): Promise<string | null> => {
        setLoading(true);
        setError(null);

        try {
          // Use Tauri's file dialog with SAF support
          const filePath = await open({
            multiple: false,
            filters: filters.length > 0 ? filters : [
              { name: 'CSV Files', extensions: ['csv'] },
              { name: 'All Files', extensions: ['*'] }
            ]
          });

          return filePath as string | null;
        } catch (err) {
          const errorMessage = `Failed to pick file: ${err}`;
          setError(errorMessage);
          console.error(errorMessage);
          return null;
        } finally {
          setLoading(false);
        }
      }, []);

      const saveFile = useCallback(async (content: string, defaultName = 'export.csv'): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
          // Use Tauri's save dialog with SAF support
          const filePath = await save({
            defaultPath: defaultName,
            filters: [
              { name: 'CSV Files', extensions: ['csv'] },
              { name: 'JSON Files', extensions: ['json'] }
            ]
          });

          if (filePath) {
            await writeTextFile(filePath, content);
            return true;
          }
          
          return false;
        } catch (err) {
          const errorMessage = `Failed to save file: ${err}`;
          setError(errorMessage);
          console.error(errorMessage);
          return false;
        } finally {
          setLoading(false);
        }
      }, []);

      const readFile = useCallback(async (path: string): Promise<string> => {
        setLoading(true);
        setError(null);

        try {
          const content = await readTextFile(path);
          return content;
        } catch (err) {
          const errorMessage = `Failed to read file: ${err}`;
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      }, []);

      const shareFile = useCallback(async (content: string, filename: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
          // For mobile sharing, we might need a custom command
          const success = await invoke<boolean>('share_file', { content, filename });
          return success;
        } catch (err) {
          // Fallback: save to downloads and notify user
          console.warn('Native sharing not available, falling back to save');
          return await saveFile(content, filename);
        } finally {
          setLoading(false);
        }
      }, [saveFile]);

      return {
        pickFile,
        saveFile,
        readFile,
        shareFile,
        loading,
        error
      };
    }
    ```

    **Step 3: Create Mobile File Import Component**
    
    Create `src/components/mobile/mobile-file-import.tsx`:
    ```typescript
    import React, { useState } from 'react';
    import { Upload, FileText, AlertCircle } from 'lucide-react';
    import { useMobileFiles } from '@/hooks/use-mobile-files';

    interface MobileFileImportProps {
      onFileSelected: (content: string, filename: string) => void;
      acceptedTypes?: string[];
      title?: string;
      description?: string;
    }

    export function MobileFileImport({ 
      onFileSelected, 
      acceptedTypes = ['csv'], 
      title = 'Import File',
      description = 'Select a file to import your data'
    }: MobileFileImportProps) {
      const { pickFile, readFile, loading, error } = useMobileFiles();
      const [selectedFile, setSelectedFile] = useState<string | null>(null);

      const handleFilePick = async () => {
        try {
          const filePath = await pickFile([
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'JSON Files', extensions: ['json'] }
          ]);

          if (filePath) {
            setSelectedFile(filePath);
            const content = await readFile(filePath);
            const filename = filePath.split('/').pop() || 'unknown';
            onFileSelected(content, filename);
          }
        } catch (err) {
          console.error('File import failed:', err);
        }
      };

      return (
        <div className="p-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="text-blue-600" size={24} />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{description}</p>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="text-green-600" size={16} />
                  <span className="text-green-800 text-sm font-medium">
                    {selectedFile.split('/').pop()}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <AlertCircle className="text-red-600" size={16} />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleFilePick}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Choose File'}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              Supported formats: {acceptedTypes.join(', ').toUpperCase()}
            </p>
          </div>
        </div>
      );
    }
    ```

    **Step 4: Create Mobile File Export Component**
    
    Create `src/components/mobile/mobile-file-export.tsx`:
    ```typescript
    import React, { useState } from 'react';
    import { Download, Share, CheckCircle } from 'lucide-react';
    import { useMobileFiles } from '@/hooks/use-mobile-files';

    interface MobileFileExportProps {
      data: any[];
      filename?: string;
      title?: string;
      onExportComplete?: () => void;
    }

    export function MobileFileExport({ 
      data, 
      filename = 'portfolio-export.csv',
      title = 'Export Data',
      onExportComplete 
    }: MobileFileExportProps) {
      const { saveFile, shareFile, loading } = useMobileFiles();
      const [exportSuccess, setExportSuccess] = useState(false);

      const convertToCSV = (data: any[]): string => {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => 
              JSON.stringify(row[header] || '')
            ).join(',')
          )
        ].join('\n');
        
        return csvContent;
      };

      const handleSave = async () => {
        const csvContent = convertToCSV(data);
        const success = await saveFile(csvContent, filename);
        
        if (success) {
          setExportSuccess(true);
          onExportComplete?.();
          setTimeout(() => setExportSuccess(false), 3000);
        }
      };

      const handleShare = async () => {
        const csvContent = convertToCSV(data);
        const success = await shareFile(csvContent, filename);
        
        if (success) {
          setExportSuccess(true);
          onExportComplete?.();
          setTimeout(() => setExportSuccess(false), 3000);
        }
      };

      return (
        <div className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">
              Export {data.length} records to CSV format
            </p>

            {exportSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-green-800 text-sm font-medium">
                    Export completed successfully!
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={loading || data.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Download size={20} />
                <span>{loading ? 'Saving...' : 'Save to Device'}</span>
              </button>

              <button
                onClick={handleShare}
                disabled={loading || data.length === 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Share size={20} />
                <span>{loading ? 'Sharing...' : 'Share File'}</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              File will be saved as: {filename}
            </p>
          </div>
        </div>
      );
    }
    ```

    **Step 5: Add File Sharing Command (Optional)**
    
    Add to `src-tauri/src/commands/sharing.rs`:
    ```rust
    #[tauri::command]
    pub async fn share_file(content: String, filename: String) -> Result<bool, String> {
        #[cfg(target_os = "android")]
        {
            // Android sharing implementation
            // This would require Android-specific code to use Intent.ACTION_SEND
            todo!("Implement Android file sharing")
        }
        
        #[cfg(not(target_os = "android"))]
        {
            // Desktop fallback - could open file manager or copy to clipboard
            println!("Sharing not available on desktop: {}", filename);
            Ok(false)
        }
    }
    ```

    **Validation Criteria**:
    - [ ] File picker opens and allows file selection
    - [ ] Selected files can be read successfully
    - [ ] File save dialog works with SAF
    - [ ] Export generates valid CSV/JSON files
    - [ ] File sharing integrates with Android share menu (if implemented)
    - [ ] Graceful fallbacks for desktop environment

    **Testing Checklist**:
    - [ ] Test with various file types (CSV, JSON, TXT)
    - [ ] Test with files from different storage locations (internal, SD card, cloud)
    - [ ] Verify permissions are requested appropriately
    - [ ] Test file operations with large files (>1MB)
    - [ ] Ensure proper error handling for invalid files

    _Requirements: 3.4, 4.4, 8.1_

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
  - [ ] 8.1 Optimize SQLite for mobile performance

    **DIRECTIVE: Enable WAL (Write-Ahead Logging) mode for significant mobile performance improvement**

    **Step 1: Enable WAL Mode in Database Connection**
    
    Update `src-core/src/database.rs` (or equivalent database setup):
    ```rust
    use diesel::prelude::*;
    use diesel::sqlite::SqliteConnection;
    use diesel::r2d2::{ConnectionManager, Pool};

    pub fn establish_connection(database_url: &str) -> Result<SqliteConnection, diesel::ConnectionError> {
        let mut connection = SqliteConnection::establish(database_url)?;
        
        // CRITICAL: Enable WAL mode for better mobile performance
        diesel::sql_query("PRAGMA journal_mode = WAL;")
            .execute(&mut connection)
            .map_err(|e| diesel::ConnectionError::BadConnection(format!("Failed to enable WAL mode: {}", e)))?;
        
        // Additional mobile optimizations
        diesel::sql_query("PRAGMA synchronous = NORMAL;")
            .execute(&mut connection)
            .map_err(|e| diesel::ConnectionError::BadConnection(format!("Failed to set synchronous mode: {}", e)))?;
        
        // Optimize for mobile memory constraints
        diesel::sql_query("PRAGMA cache_size = -2000;") // 2MB cache
            .execute(&mut connection)
            .map_err(|e| diesel::ConnectionError::BadConnection(format!("Failed to set cache size: {}", e)))?;
        
        // Enable foreign key constraints
        diesel::sql_query("PRAGMA foreign_keys = ON;")
            .execute(&mut connection)
            .map_err(|e| diesel::ConnectionError::BadConnection(format!("Failed to enable foreign keys: {}", e)))?;
        
        Ok(connection)
    }

    // Mobile-optimized connection pool
    pub fn create_mobile_pool(database_url: &str) -> Result<Pool<ConnectionManager<SqliteConnection>>, r2d2::Error> {
        let manager = ConnectionManager::<SqliteConnection>::new(database_url);
        
        Pool::builder()
            .max_size(3) // Reduced from desktop default (10) for mobile
            .min_idle(Some(1)) // Keep one connection alive
            .connection_timeout(std::time::Duration::from_secs(5))
            .idle_timeout(Some(std::time::Duration::from_secs(300))) // 5 minutes
            .build(manager)
    }
    ```

    **Step 2: Create Mobile Database Configuration**
    
    Create `src-core/src/mobile_db_config.rs`:
    ```rust
    use diesel::prelude::*;
    use diesel::sqlite::SqliteConnection;

    pub struct MobileDatabaseConfig {
        pub wal_mode: bool,
        pub cache_size_kb: i32,
        pub synchronous_mode: SynchronousMode,
        pub temp_store: TempStore,
        pub mmap_size: i64,
    }

    pub enum SynchronousMode {
        Off,     // Fastest, least safe
        Normal,  // Good balance for mobile
        Full,    // Safest, slowest
    }

    pub enum TempStore {
        Default,
        File,
        Memory,
    }

    impl Default for MobileDatabaseConfig {
        fn default() -> Self {
            Self {
                wal_mode: true,
                cache_size_kb: 2048, // 2MB cache
                synchronous_mode: SynchronousMode::Normal,
                temp_store: TempStore::Memory,
                mmap_size: 268435456, // 256MB memory mapping
            }
        }
    }

    impl MobileDatabaseConfig {
        pub fn apply_to_connection(&self, connection: &mut SqliteConnection) -> Result<(), diesel::result::Error> {
            // Enable WAL mode
            if self.wal_mode {
                diesel::sql_query("PRAGMA journal_mode = WAL;").execute(connection)?;
            }

            // Set cache size (negative value = KB)
            let cache_pragma = format!("PRAGMA cache_size = -{};", self.cache_size_kb);
            diesel::sql_query(&cache_pragma).execute(connection)?;

            // Set synchronous mode
            let sync_mode = match self.synchronous_mode {
                SynchronousMode::Off => "OFF",
                SynchronousMode::Normal => "NORMAL", 
                SynchronousMode::Full => "FULL",
            };
            let sync_pragma = format!("PRAGMA synchronous = {};", sync_mode);
            diesel::sql_query(&sync_pragma).execute(connection)?;

            // Set temp store
            let temp_mode = match self.temp_store {
                TempStore::Default => "DEFAULT",
                TempStore::File => "FILE",
                TempStore::Memory => "MEMORY",
            };
            let temp_pragma = format!("PRAGMA temp_store = {};", temp_mode);
            diesel::sql_query(&temp_pragma).execute(connection)?;

            // Set memory mapping size
            let mmap_pragma = format!("PRAGMA mmap_size = {};", self.mmap_size);
            diesel::sql_query(&mmap_pragma).execute(connection)?;

            // Additional mobile optimizations
            diesel::sql_query("PRAGMA foreign_keys = ON;").execute(connection)?;
            diesel::sql_query("PRAGMA optimize;").execute(connection)?; // Analyze tables

            Ok(())
        }

        // Battery-optimized configuration
        pub fn battery_optimized() -> Self {
            Self {
                wal_mode: true,
                cache_size_kb: 1024, // Smaller cache
                synchronous_mode: SynchronousMode::Normal,
                temp_store: TempStore::Memory,
                mmap_size: 134217728, // 128MB
            }
        }

        // Performance-optimized configuration
        pub fn performance_optimized() -> Self {
            Self {
                wal_mode: true,
                cache_size_kb: 4096, // Larger cache
                synchronous_mode: SynchronousMode::Normal,
                temp_store: TempStore::Memory,
                mmap_size: 536870912, // 512MB
            }
        }
    }
    ```

    **Step 3: Implement Connection Health Monitoring**
    
    Create `src-core/src/db_health.rs`:
    ```rust
    use diesel::prelude::*;
    use diesel::sqlite::SqliteConnection;
    use std::time::{Duration, Instant};

    pub struct DatabaseHealth {
        pub connection_count: usize,
        pub avg_query_time: Duration,
        pub cache_hit_ratio: f64,
        pub wal_file_size: u64,
        pub last_checkpoint: Option<Instant>,
    }

    pub fn check_database_health(connection: &mut SqliteConnection) -> Result<DatabaseHealth, diesel::result::Error> {
        // Check cache statistics
        let cache_stats: (i32, i32) = diesel::sql_query("PRAGMA cache_spill;")
            .get_result(connection)
            .unwrap_or((0, 0));

        // Check WAL file size
        let wal_size: i64 = diesel::sql_query("PRAGMA wal_checkpoint(PASSIVE);")
            .get_result(connection)
            .unwrap_or(0);

        // Get page cache hit ratio
        let cache_hit_ratio = calculate_cache_hit_ratio(connection)?;

        Ok(DatabaseHealth {
            connection_count: 1, // Would need pool reference for actual count
            avg_query_time: Duration::from_millis(0), // Would need query timing
            cache_hit_ratio,
            wal_file_size: wal_size as u64,
            last_checkpoint: None, // Would track checkpoint times
        })
    }

    fn calculate_cache_hit_ratio(connection: &mut SqliteConnection) -> Result<f64, diesel::result::Error> {
        // This would require implementing PRAGMA stats collection
        // For now, return a placeholder
        Ok(0.95) // 95% cache hit ratio
    }

    // Automatic WAL checkpoint when file gets too large
    pub fn maybe_checkpoint_wal(connection: &mut SqliteConnection, max_wal_size: u64) -> Result<(), diesel::result::Error> {
        let health = check_database_health(connection)?;
        
        if health.wal_file_size > max_wal_size {
            diesel::sql_query("PRAGMA wal_checkpoint(TRUNCATE);").execute(connection)?;
            println!("WAL checkpoint completed, file size was: {} bytes", health.wal_file_size);
        }
        
        Ok(())
    }
    ```

    **Step 4: Create Mobile Database Manager**
    
    Create `src-core/src/mobile_db_manager.rs`:
    ```rust
    use crate::mobile_db_config::{MobileDatabaseConfig, SynchronousMode};
    use diesel::r2d2::{ConnectionManager, Pool};
    use diesel::sqlite::SqliteConnection;
    use std::sync::Arc;

    pub struct MobileDatabaseManager {
        pool: Arc<Pool<ConnectionManager<SqliteConnection>>>,
        config: MobileDatabaseConfig,
        is_low_power_mode: bool,
    }

    impl MobileDatabaseManager {
        pub fn new(database_url: &str, low_power_mode: bool) -> Result<Self, Box<dyn std::error::Error>> {
            let config = if low_power_mode {
                MobileDatabaseConfig::battery_optimized()
            } else {
                MobileDatabaseConfig::performance_optimized()
            };

            let manager = ConnectionManager::<SqliteConnection>::new(database_url);
            let pool = Pool::builder()
                .max_size(if low_power_mode { 2 } else { 3 })
                .min_idle(Some(1))
                .connection_timeout(std::time::Duration::from_secs(5))
                .connection_customizer(Box::new(MobileConnectionCustomizer::new(config.clone())))
                .build(manager)?;

            Ok(Self {
                pool: Arc::new(pool),
                config,
                is_low_power_mode: low_power_mode,
            })
        }

        pub fn get_connection(&self) -> Result<r2d2::PooledConnection<ConnectionManager<SqliteConnection>>, r2d2::Error> {
            self.pool.get()
        }

        pub fn switch_to_low_power_mode(&mut self) -> Result<(), Box<dyn std::error::Error>> {
            if !self.is_low_power_mode {
                self.is_low_power_mode = true;
                self.config = MobileDatabaseConfig::battery_optimized();
                // Would need to reconfigure existing connections
                println!("Switched to low power database mode");
            }
            Ok(())
        }

        pub fn switch_to_performance_mode(&mut self) -> Result<(), Box<dyn std::error::Error>> {
            if self.is_low_power_mode {
                self.is_low_power_mode = false;
                self.config = MobileDatabaseConfig::performance_optimized();
                println!("Switched to performance database mode");
            }
            Ok(())
        }
    }

    // Connection customizer to apply mobile config
    #[derive(Clone)]
    struct MobileConnectionCustomizer {
        config: MobileDatabaseConfig,
    }

    impl MobileConnectionCustomizer {
        fn new(config: MobileDatabaseConfig) -> Self {
            Self { config }
        }
    }

    impl r2d2::CustomizeConnection<SqliteConnection, diesel::result::Error> for MobileConnectionCustomizer {
        fn on_acquire(&self, connection: &mut SqliteConnection) -> Result<(), diesel::result::Error> {
            self.config.apply_to_connection(connection)
        }
    }
    ```

    **Step 5: Integration with Tauri Commands**
    
    Update database initialization in `src-tauri/src/context.rs`:
    ```rust
    use wealthfolio_core::mobile_db_manager::MobileDatabaseManager;

    pub async fn initialize_context(app_data_dir: &str) -> Result<ServiceContext, Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}/wealthfolio.db", app_data_dir);
        
        // Detect if running on mobile for database optimization
        let is_mobile = cfg!(target_os = "android") || cfg!(target_os = "ios");
        let low_power_mode = is_mobile; // Could be configurable
        
        let db_manager = MobileDatabaseManager::new(&database_url, low_power_mode)?;
        
        // Rest of context initialization...
        Ok(ServiceContext {
            // ... other fields
        })
    }
    ```

    **Mobile SQLite Optimization Benefits**:

    1. **WAL Mode**: 
       - Allows concurrent reads while writing
       - Better performance on mobile storage
       - Reduces lock contention

    2. **Optimized Cache Size**: 
       - Balances memory usage with performance
       - Adapts to mobile memory constraints

    3. **Connection Pooling**: 
       - Reduces connection overhead
       - Manages resources efficiently

    4. **Battery Optimization**: 
       - Reduces disk I/O in low power mode
       - Adapts to device power state

    **Validation Criteria**:
    - [ ] WAL mode is enabled and functioning
    - [ ] Database operations are faster than before optimization
    - [ ] Memory usage remains within mobile constraints
    - [ ] Battery impact is minimized in low power mode
    - [ ] Connection pooling works correctly
    - [ ] Database health monitoring provides useful metrics

    **Performance Testing**:
    ```rust
    #[cfg(test)]
    mod tests {
        use super::*;
        use std::time::Instant;

        #[test]
        fn test_mobile_db_performance() {
            let manager = MobileDatabaseManager::new(":memory:", false).unwrap();
            let mut connection = manager.get_connection().unwrap();
            
            let start = Instant::now();
            // Perform test operations
            let duration = start.elapsed();
            
            assert!(duration.as_millis() < 100); // Should complete in <100ms
        }
    }
    ```

    _Requirements: 4.1, 5.1_

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

  - [ ] 9.2 Optimize bundle size and assets using bundle analysis

    **DIRECTIVE: Use vite-bundle-visualizer to identify and eliminate large dependencies**

    **Step 1: Install and Run Bundle Visualizer**
    
    ```bash
    # Install the bundle visualizer
    npm install --save-dev vite-bundle-visualizer

    # Add script to package.json
    # "scripts": {
    #   "analyze": "vite-bundle-visualizer"
    # }

    # Build and analyze the bundle
    npm run build
    npm run analyze
    ```

    This will generate a visual map showing:
    - Which dependencies are largest
    - Unused code that can be eliminated
    - Opportunities for code splitting

    **Step 2: Configure Vite for Mobile Optimization**
    
    Update `vite.config.ts`:
    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import { visualizer } from 'rollup-plugin-visualizer';
    import path from 'path';

    export default defineConfig({
      plugins: [
        react(),
        // Add bundle visualizer for development
        process.env.ANALYZE && visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },

      // Mobile-specific build optimizations
      build: {
        // Target modern browsers for smaller bundles
        target: ['chrome89', 'firefox89', 'safari14'],
        
        // Optimize for mobile
        minify: 'esbuild', // Faster than terser
        
        // Configure chunk splitting for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunk for stable dependencies
              vendor: ['react', 'react-dom', 'react-router-dom'],
              
              // UI components chunk
              ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
              
              // Charts chunk (lazy loaded)
              charts: ['recharts'],
              
              // Utils chunk
              utils: ['date-fns', 'lodash', 'clsx'],
            },
          },
        },
        
        // Optimize chunk size limits for mobile
        chunkSizeWarningLimit: 500, // 500kb warning (mobile-friendly)
        
        // Enable source maps for debugging but optimize size
        sourcemap: process.env.NODE_ENV === 'development',
      },

      // Optimize dev server for mobile testing
      server: {
        host: '0.0.0.0', // Allow mobile device connections
        port: 1420,
        strictPort: true,
      },
    });
    ```

    **Step 3: Implement Dynamic Imports for Large Components**
    
    **Before (Bundle Bloat)**:
    ```typescript
    // This loads recharts immediately, increasing initial bundle size
    import { LineChart, BarChart, PieChart } from 'recharts';
    ```

    **After (Lazy Loading)**:
    ```typescript
    // Create lazy-loaded chart components
    import React, { Suspense, lazy } from 'react';

    // Lazy load chart components
    const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));
    const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
    const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));

    // Wrapper component with loading state
    export function LazyChart({ type, ...props }: { type: 'line' | 'bar' | 'pie' }) {
      const ChartComponent = {
        line: LineChart,
        bar: BarChart,
        pie: PieChart,
      }[type];

      return (
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ChartComponent {...props} />
        </Suspense>
      );
    }
    ```

    **Step 4: Optimize Images and Assets**
    
    Create `src/utils/image-optimization.ts`:
    ```typescript
    // Image optimization utilities for mobile
    export const getOptimizedImageUrl = (
      originalUrl: string, 
      width: number, 
      quality: number = 80
    ): string => {
      // For static images, you might use a service like Cloudinary
      // For now, we'll focus on proper sizing
      return originalUrl;
    };

    // Responsive image component
    interface ResponsiveImageProps {
      src: string;
      alt: string;
      className?: string;
      sizes?: string;
    }

    export function ResponsiveImage({ src, alt, className, sizes }: ResponsiveImageProps) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          loading="lazy" // Native lazy loading
          decoding="async" // Async image decoding
        />
      );
    }
    ```

    **Step 5: Tree Shaking Configuration**
    
    Update `package.json` to enable tree shaking:
    ```json
    {
      "sideEffects": [
        "*.css",
        "*.scss",
        "./src/styles.css"
      ]
    }
    ```

    Create `.babelrc` for better tree shaking:
    ```json
    {
      "presets": [
        ["@babel/preset-env", {
          "modules": false,
          "useBuiltIns": "usage",
          "corejs": 3
        }],
        "@babel/preset-react",
        "@babel/preset-typescript"
      ]
    }
    ```

    **Step 6: Analyze and Optimize Dependencies**
    
    Create `scripts/analyze-bundle.js`:
    ```javascript
    const { execSync } = require('child_process');
    const fs = require('fs');

    // Build and analyze
    console.log('Building for production...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Analyzing bundle...');
    execSync('npx vite-bundle-visualizer', { stdio: 'inherit' });

    // Check bundle sizes
    const distPath = './dist';
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      
      console.log('\n📦 Bundle Analysis:');
      jsFiles.forEach(file => {
        const stats = fs.statSync(`${distPath}/${file}`);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const status = stats.size > 500000 ? '⚠️' : '✅';
        console.log(`${status} ${file}: ${sizeKB} KB`);
      });

      // Calculate total size
      const totalSize = jsFiles.reduce((total, file) => {
        return total + fs.statSync(`${distPath}/${file}`).size;
      }, 0);
      
      const totalMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`\n📊 Total JS Bundle Size: ${totalMB} MB`);
      
      if (totalSize > 2 * 1024 * 1024) { // 2MB threshold
        console.log('⚠️  Bundle size is large for mobile. Consider:');
        console.log('   - More aggressive code splitting');
        console.log('   - Removing unused dependencies');
        console.log('   - Lazy loading heavy components');
      } else {
        console.log('✅ Bundle size is mobile-friendly!');
      }
    }
    ```

    **Step 7: Mobile Asset Optimization**
    
    Create `public/manifest.json` for PWA optimization:
    ```json
    {
      "name": "Wealthfolio",
      "short_name": "Wealthfolio",
      "description": "Investment Portfolio Tracker",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#3b82f6",
      "icons": [
        {
          "src": "/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any maskable"
        },
        {
          "src": "/icons/icon-512x512.png", 
          "sizes": "512x512",
          "type": "image/png"
        }
      ]
    }
    ```

    **Bundle Optimization Checklist**:

    - [ ] **Run bundle visualizer** and identify largest dependencies
    - [ ] **Implement code splitting** for routes and heavy components
    - [ ] **Lazy load charts** and other heavy UI components
    - [ ] **Remove unused dependencies** identified in analysis
    - [ ] **Configure tree shaking** to eliminate dead code
    - [ ] **Optimize images** with proper sizing and lazy loading
    - [ ] **Set bundle size limits** and monitor in CI/CD

    **Common Large Dependencies to Address**:

    1. **Recharts** (~200KB): Lazy load chart components
    2. **Date-fns** (~100KB): Import only needed functions
    3. **Lodash** (~70KB): Use lodash-es or individual imports
    4. **Radix UI** (~150KB): Split into separate chunks

    **Example Optimization Results**:
    ```
    Before Optimization:
    📦 main.js: 1,247 KB
    📦 vendor.js: 892 KB
    📊 Total: 2.14 MB

    After Optimization:
    📦 main.js: 234 KB
    📦 vendor.js: 445 KB  
    📦 charts.js: 198 KB (lazy loaded)
    📦 ui.js: 156 KB
    📊 Total Initial: 679 KB (68% reduction!)
    ```

    **Validation Criteria**:
    - [ ] Initial bundle size < 1MB for mobile-friendly loading
    - [ ] Charts and heavy components are lazy loaded
    - [ ] Bundle visualizer shows no unexpectedly large dependencies
    - [ ] Tree shaking eliminates unused code
    - [ ] Images are optimized and lazy loaded
    - [ ] Build process includes bundle size monitoring

    _Requirements: 5.1, 5.4_

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

  - [ ] 13.3 Generate signed personal-use APK with proper app signing

    **CRITICAL: Proper app signing is essential for APK installation and updates**

    **Step 1: Generate Android Keystore**
    
    ```bash
    # Generate a new keystore (DO THIS ONCE and keep it safe!)
    keytool -genkey -v -keystore wealthfolio-release-key.keystore \
            -alias wealthfolio \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass YOUR_STORE_PASSWORD \
            -keypass YOUR_KEY_PASSWORD
    
    # You'll be prompted for information:
    # - First and last name: Your Name
    # - Organizational unit: (can be blank)
    # - Organization: (can be blank) 
    # - City/Locality: Your City
    # - State/Province: Your State
    # - Country code: US (or your country)
    ```

    **SECURITY WARNING**: 
    - Store the keystore file securely (NOT in your git repository)
    - Use a strong password and store it in a password manager
    - Back up the keystore - if you lose it, you can't update your app
    - Consider using a dedicated folder like `~/.android/keystores/`

    **Step 2: Configure Tauri for Release Signing**
    
    Update `src-tauri/tauri.conf.json`:
    ```json
    {
      "mobile": {
        "android": {
          "minSdkVersion": 24,
          "compileSdkVersion": 33,
          "targetSdkVersion": 33,
          "versionCode": 116,
          "signing": {
            "keystore": {
              "path": "/absolute/path/to/wealthfolio-release-key.keystore",
              "keyAlias": "wealthfolio",
              "storePassword": "env:KEYSTORE_PASSWORD",
              "keyPassword": "env:KEY_PASSWORD"
            }
          }
        }
      }
    }
    ```

    **Step 3: Create Environment Configuration**
    
    Create `.env.local` (DO NOT commit to git):
    ```bash
    # Android signing credentials
    KEYSTORE_PASSWORD=your_store_password_here
    KEY_PASSWORD=your_key_password_here
    ```

    Add to `.gitignore`:
    ```
    # Android signing
    *.keystore
    .env.local
    ```

    **Step 4: Create Release Build Script**
    
    Create `scripts/build-release-apk.sh`:
    ```bash
    #!/bin/bash
    set -e

    echo "🚀 Building Wealthfolio Release APK"

    # Check environment variables
    if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_PASSWORD" ]; then
        echo "❌ Error: KEYSTORE_PASSWORD and KEY_PASSWORD must be set"
        echo "   Create .env.local with your keystore credentials"
        exit 1
    fi

    # Check keystore exists
    KEYSTORE_PATH="$HOME/.android/keystores/wealthfolio-release-key.keystore"
    if [ ! -f "$KEYSTORE_PATH" ]; then
        echo "❌ Error: Keystore not found at $KEYSTORE_PATH"
        echo "   Run the keytool command to generate it first"
        exit 1
    fi

    # Load environment variables
    if [ -f ".env.local" ]; then
        export $(cat .env.local | xargs)
    fi

    # Clean previous builds
    echo "🧹 Cleaning previous builds..."
    rm -rf dist/
    rm -rf src-tauri/gen/android/app/build/

    # Build frontend
    echo "📦 Building frontend..."
    npm run build

    # Build Android APK
    echo "🤖 Building Android APK..."
    cargo tauri android build --release

    # Find the generated APK
    APK_PATH=$(find src-tauri/gen/android/app/build/outputs/apk/release -name "*.apk" | head -1)

    if [ -f "$APK_PATH" ]; then
        # Copy to easy-to-find location
        RELEASE_APK="wealthfolio-v$(grep '"version"' package.json | cut -d'"' -f4).apk"
        cp "$APK_PATH" "./$RELEASE_APK"
        
        echo "✅ Release APK built successfully!"
        echo "📱 APK location: ./$RELEASE_APK"
        echo "📊 APK size: $(du -h "$RELEASE_APK" | cut -f1)"
        
        # Verify APK signature
        echo "🔐 Verifying APK signature..."
        jarsigner -verify -verbose -certs "$RELEASE_APK"
        
        if [ $? -eq 0 ]; then
            echo "✅ APK signature verified!"
        else
            echo "❌ APK signature verification failed!"
            exit 1
        fi
        
    else
        echo "❌ APK build failed - no APK found"
        exit 1
    fi
    ```

    Make script executable:
    ```bash
    chmod +x scripts/build-release-apk.sh
    ```

    **Step 5: Create Installation Guide**
    
    Create `MOBILE_INSTALLATION.md`:
    ```markdown
    # Wealthfolio Mobile Installation Guide

    ## Prerequisites
    - Android device running Android 7.0 (API 24) or higher
    - ~50MB free storage space

    ## Installation Steps

    ### 1. Enable Unknown Sources
    1. Open **Settings** on your Android device
    2. Navigate to **Security** or **Privacy & Security**
    3. Find **Install unknown apps** or **Unknown sources**
    4. Enable installation from your file manager or browser

    ### 2. Download APK
    1. Transfer the APK file to your device via:
       - USB cable and file transfer
       - Email attachment
       - Cloud storage (Google Drive, Dropbox)
       - Direct download if hosted

    ### 3. Install APK
    1. Open your file manager
    2. Navigate to the APK file location
    3. Tap the APK file
    4. Tap **Install** when prompted
    5. Wait for installation to complete
    6. Tap **Open** to launch the app

    ## Updating the App

    ### Important: Version Code
    - Each update must have a higher version code
    - Current version: 1.1.6 (code: 116)
    - Next version should be 1.1.7 (code: 117)

    ### Update Process
    1. Download the new APK
    2. Install over the existing app
    3. Your data will be preserved

    ## Troubleshooting

    ### "App not installed" Error
    - **Cause**: Version code is lower than installed version
    - **Solution**: Uninstall old version first, or increment version code

    ### "Parse Error" 
    - **Cause**: Corrupted APK or incompatible device
    - **Solution**: Re-download APK, check Android version compatibility

    ### "Installation blocked"
    - **Cause**: Unknown sources not enabled
    - **Solution**: Enable "Install unknown apps" in Settings

    ### App Crashes on Startup
    - **Cause**: Missing permissions or corrupted data
    - **Solution**: Clear app data in Settings > Apps > Wealthfolio > Storage

    ## Data Backup
    Before major updates, export your data:
    1. Open Wealthfolio
    2. Go to Settings > Export Data
    3. Save the export file to safe location

    ## Uninstallation
    1. Long press the Wealthfolio app icon
    2. Tap "Uninstall" or drag to uninstall area
    3. Confirm uninstallation
    4. **Note**: This will delete all app data permanently
    ```

    **Step 6: Create Release Checklist**
    
    Create `RELEASE_CHECKLIST.md`:
    ```markdown
    # Release Checklist

    ## Pre-Release
    - [ ] All features tested on Android emulator
    - [ ] Version number incremented in package.json
    - [ ] Version code incremented in tauri.conf.json
    - [ ] Database migrations tested (if any)
    - [ ] Performance testing completed
    - [ ] Bundle size optimized and verified

    ## Build Process
    - [ ] Environment variables set (.env.local)
    - [ ] Keystore file accessible
    - [ ] Frontend build successful (npm run build)
    - [ ] Android build successful (cargo tauri android build --release)
    - [ ] APK signature verified

    ## Post-Build Testing
    - [ ] APK installs on test device
    - [ ] App launches without crashes
    - [ ] Core functionality works (portfolio view, transactions)
    - [ ] Data import/export works
    - [ ] Performance acceptable on target devices

    ## Distribution
    - [ ] APK renamed with version number
    - [ ] Installation guide updated
    - [ ] Release notes prepared
    - [ ] APK file size documented
    - [ ] Backup of signed APK created

    ## Security
    - [ ] Keystore backed up securely
    - [ ] Passwords stored in password manager
    - [ ] No sensitive data in git repository
    - [ ] APK signature matches expected certificate
    ```

    **Step 7: Automated Version Management**
    
    Create `scripts/increment-version.js`:
    ```javascript
    const fs = require('fs');
    const path = require('path');

    // Read package.json
    const packagePath = path.join(__dirname, '..', 'package.json');
    const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Read tauri.conf.json
    const tauriConfigPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));

    // Increment version
    const currentVersion = package.version;
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++; // Increment patch version

    const newVersion = versionParts.join('.');
    const newVersionCode = parseInt(versionParts.join(''));

    // Update package.json
    package.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

    // Update tauri.conf.json
    tauriConfig.version = newVersion;
    tauriConfig.mobile.android.versionCode = newVersionCode;
    fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2));

    console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);
    console.log(`✅ Version code updated: ${newVersionCode}`);
    ```

    **Usage**:
    ```bash
    # Increment version and build
    node scripts/increment-version.js
    ./scripts/build-release-apk.sh
    ```

    **Validation Criteria**:
    - [ ] Keystore generated and stored securely
    - [ ] APK builds and signs successfully
    - [ ] APK installs on Android device
    - [ ] App launches and functions correctly
    - [ ] Version management works properly
    - [ ] Installation guide is clear and complete
    - [ ] Release process is documented and repeatable

    **Security Best Practices**:
    - ✅ Keystore stored outside git repository
    - ✅ Passwords stored in environment variables
    - ✅ Keystore backed up securely
    - ✅ APK signature verified before distribution
    - ❌ Never commit keystore or passwords to git

    _Requirements: 7.1, 7.4, 7.5_

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