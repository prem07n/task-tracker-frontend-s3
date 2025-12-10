# Task Tracker — S3 Static Hosting + Cognito Hosted UI

This is a minimal HTML/CSS/JS app that:
- runs as a static website from Amazon S3
- uses **AWS Cognito Hosted UI** for sign-in via a simple redirect flow
- stores tasks locally in `localStorage` (no backend)

## Configure Cognito
1. Create a **User Pool** and an **App client** (no secret).  
2. Set **Domain** for Hosted UI (e.g., `your-prefix.auth.ap-south-1.amazoncognito.com`).  
3. In App client settings: add **Callback URL**: your S3 website URL, e.g. `http://your-bucket.s3-website-ap-south-1.amazonaws.com/index.html`  
4. Allowed OAuth flows: `Implicit grant` (for this example).  
5. Allowed OAuth scopes: `openid` and `email`.

Update placeholders in `app.js`:
```js
const COGNITO_DOMAIN = "your-prefix.auth.ap-south-1.amazoncognito.com";
const CLIENT_ID = "xxxxxxxxxxxxxxxxxxxx";
const REDIRECT_URI = "http://your-bucket.s3-website-ap-south-1.amazonaws.com/index.html";
```

## S3 Static Website (console quick steps)
1. Create bucket named like your site (must be **globally unique**). Region example: **ap-south-1** (Mumbai).
2. **Disable** "Block all public access" for this bucket (required for S3 static website endpoints).
3. Upload `index.html`, `styles.css`, `app.js`.
4. Enable **Static website hosting** (Properties → Static website hosting → Host a static website → index: `index.html`).
5. Add a **Bucket policy** to allow public reads:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```
6. Open the **Website endpoint** (looks like `http://YOUR_BUCKET_NAME.s3-website-REGION.amazonaws.com`).

## CLI (optional)
```bash
aws s3api create-bucket --bucket YOUR_BUCKET_NAME --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket YOUR_BUCKET_NAME --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3 website s3://YOUR_BUCKET_NAME/ --index-document index.html
aws s3 cp /path/to/site s3://YOUR_BUCKET_NAME/ --recursive
aws s3api put-bucket-policy --bucket YOUR_BUCKET_NAME --policy file://policy.json
```

## Notes
- For production, prefer CloudFront + OAC over direct public S3.
- If you switch to **Authorization Code + PKCE**, you'll need a tiny JS PKCE helper instead of `response_type=token`.
- Take a **screenshot** of the login page after upload and include the S3 website URL in your submission.
