import java.util.Properties

plugins {
    id("com.android.application")
}

// Signing config is read from keystore.properties (git-ignored) when present, so
// the project still builds (debug / unsigned release) on a machine without the key.
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) keystorePropsFile.inputStream().use { load(it) }
}
val hasSigning = keystoreProps.getProperty("storeFile") != null

android {
    namespace = "co.smallvictories.rekenavontuur"
    compileSdk = 36

    defaultConfig {
        // Must match the Play Console listing exactly, and is permanent once
        // published. The listing was created as "Math Adventure", so this does
        // not track `namespace` above (which is internal only).
        applicationId = "co.smallvictories.mathadventure"
        minSdk = 24
        targetSdk = 36
        versionCode = 2
        versionName = "1.0.1"
    }

    signingConfigs {
        if (hasSigning) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasSigning) signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

/**
 * Copies the PWA build output (../dist) into assets/www so it ships inside the
 * APK/AAB. The destination is git-ignored — ../dist stays the single source of
 * truth, and `npm run build:dist` in the repo root is the only build step the
 * web side needs.
 */
val syncWebAssets by tasks.registering(Sync::class) {
    val dist = rootProject.file("../dist")
    from(dist) {
        // The WebView already serves every file locally; a service worker on
        // top of that would only add a second, staler cache layer.
        exclude("sw.js")
    }
    into(project.file("src/main/assets/www"))
    doFirst {
        require(File(dist, "index.html").exists()) {
            "../dist is missing — run `npm run build:dist` in the repo root first."
        }
    }
}

/**
 * Debug-only: bundle the screenshot scene library so the capture script can
 * trigger a scene with a tiny intent extra instead of pushing ~12 KB of
 * JavaScript through the adb command line (which silently truncates).
 * Lives in the debug source set, so it is not in anything shippable.
 */
val syncSceneLibrary by tasks.registering(Sync::class) {
    from(rootProject.file("../store/screenshots")) { include("scenes.js") }
    into(project.file("src/debug/assets/screenshots"))
}

tasks.named("preBuild") { dependsOn(syncWebAssets) }
tasks.matching { it.name == "preDebugBuild" }.configureEach { dependsOn(syncSceneLibrary) }
