package co.smallvictories.rekenavontuur;

import android.app.Activity;
import android.webkit.JavascriptInterface;

import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * Exposed to the page as {@code window.AndroidReview}. The web app calls
 * {@link #request()} only after a grown-up has passed its parental gate; the
 * frequency limits live in the web app. Google Play decides whether the review
 * sheet actually appears, and never says whether it did.
 */
final class ReviewBridge {

    static final String NAME = "AndroidReview";

    private final Activity activity;
    private final ReviewManager manager;

    ReviewBridge(Activity activity) {
        this.activity = activity;
        this.manager = ReviewManagerFactory.create(activity.getApplicationContext());
    }

    /** Called on the WebView's JavaBridge thread. */
    @JavascriptInterface
    public void request() {
        activity.runOnUiThread(() ->
                manager.requestReviewFlow().addOnCompleteListener(task -> {
                    if (!task.isSuccessful() || activity.isFinishing()) return;
                    ReviewInfo info = task.getResult();
                    manager.launchReviewFlow(activity, info);
                }));
    }
}
