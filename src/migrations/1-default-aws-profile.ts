export async function migrate(browser: typeof import("webextension-polyfill")) {
  console.log("Migration: 1-default-aws-profile - start");

  const res1 = await browser.storage.local.get("awsCredentials");
  const res2 = await browser.storage.local.get("awsProfiles");

  const legacyCredentials = res1.awsCredentials as
    | {
        accessKeyId: string;
        secretAccessKey: string;
      }
    | undefined;

  const awsProfiles = res2.awsProfiles as
    | {
        name: string;
        accessKeyId: string;
        secretAccessKey: string;
      }[]
    | undefined;

  console.log("legacyCredentials", legacyCredentials);
  console.log("awsProfiles", awsProfiles);

  if (legacyCredentials && (!awsProfiles || awsProfiles.length === 0)) {
    console.log(
      "Migration: 1-default-aws-profile - found legacy credentials, convert it to default profile"
    );

    const defaultProfile = {
      name: "default",
      accessKeyId: legacyCredentials.accessKeyId,
      secretAccessKey: legacyCredentials.secretAccessKey,
    };
    await chrome.storage.local.set({ awsProfiles: [defaultProfile] });
  } else {
    console.log("Migration: 1-default-aws-profile - nothing todo");
  }
}
