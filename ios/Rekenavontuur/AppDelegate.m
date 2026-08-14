#import "AppDelegate.h"
#import "GameViewController.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions {
    self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
    self.window.rootViewController = [[GameViewController alloc] init];
    [self.window makeKeyAndVisible];

    // A maths drill is a sit-down-with-it activity; letting the screen dim
    // mid-sum is the fastest way to lose a six-year-old's attention.
    application.idleTimerDisabled = YES;
    return YES;
}

@end
