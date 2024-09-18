import React, { useState, useEffect } from "react";

interface AWSProfile {
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export const PopupApp: React.FC = () => {
  const [profiles, setProfiles] = useState<AWSProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState<string>("");

  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Load saved profiles when component mounts
    chrome.storage.local.get(["awsProfiles"], (result) => {
      if (result.awsProfiles) {
        setProfiles(result.awsProfiles);
      }
    });
  }, []);

  // New useEffect for auto-saving profiles
  useEffect(() => {
    const saveProfiles = () => {
      chrome.storage.local.set({ awsProfiles: profiles }, () => {
        console.log("Profiles auto-saved");
      });
    };

    const debounceTimer = setTimeout(saveProfiles, 200);

    return () => clearTimeout(debounceTimer);
  }, [profiles]);

  const addProfile = () => {
    if (newProfileName) {
      if (profiles.some((p) => p.name === newProfileName)) {
        setError(`Profile name "${newProfileName}" is already taken.`);
      } else {
        const newProfile: AWSProfile = {
          name: newProfileName,
          accessKeyId: "",
          secretAccessKey: "",
        };
        setProfiles([...profiles, newProfile]);
        setNewProfileName("");
        setError(null);
      }
    }
  };

  const updateProfile = (
    oldName: string,
    field: keyof AWSProfile,
    value: string
  ) => {
    setProfiles(
      profiles.map((profile) => {
        if (profile.name === oldName) {
          if (field === "name") {
            if (profiles.some((p) => p.name === value && p.name !== oldName)) {
              setError(`Profile name "${value}" is already taken.`);
              return profile;
            }
            setError(null);
          }
          return { ...profile, [field]: value };
        }
        return profile;
      })
    );
  };

  const ensureUniqueName = (name: string, currentName?: string): string => {
    let uniqueName = name;
    let counter = 1;
    while (
      profiles.some((p) => p.name === uniqueName && p.name !== currentName)
    ) {
      uniqueName = `${name} (${counter})`;
      counter++;
    }
    return uniqueName;
  };

  // Update the deleteProfile function
  const deleteProfile = (profileName: string) => {
    if (profileName === profileToDelete) {
      setProfiles(profiles.filter((profile) => profile.name !== profileName));
      setProfileToDelete(null);
      setError(null);
    } else {
      setProfileToDelete(profileName);
    }
  };

  // Add a new function to cancel deletion
  const cancelDelete = () => {
    setProfileToDelete(null);
  };

  return (
    <div className="container mx-auto" style={{ width: "390px" }}>
      <div className="bg-gray-800 shadow-md p-6">
        <div className="flex items-center mb-4 text-center">
          <a
            href="https://awsdash.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/awsdash-dark.svg" alt="AwsDash Logo" className="w-48" />
          </a>
        </div>
        <p className="mb-4">
          <a
            href="https://awsdash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Visit AWS Dash
          </a>
        </p>

        {profiles.map((profile) => (
          <div
            key={profile.name}
            className="mb-6 pb-4 border-b border-gray-700"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <label
                  htmlFor={`profile-name-${profile.name}`}
                  className="block text-sm font-medium text-gray-300 mr-2"
                >
                  Profile Name:
                </label>
                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-sm rounded">
                  {profile.name}
                </span>
              </div>
              {profileToDelete === profile.name ? (
                <div>
                  <button
                    onClick={() => deleteProfile(profile.name)}
                    className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="ml-2 px-2 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setProfileToDelete(profile.name)}
                  className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor={`aws-key-${profile.name}`}
                className="block text-sm font-medium text-gray-300"
              >
                AWS Key:
              </label>
              <input
                type="text"
                id={`aws-key-${profile.name}`}
                value={profile.accessKeyId}
                onChange={(e) =>
                  updateProfile(profile.name, "accessKeyId", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`aws-secret-${profile.name}`}
                className="block text-sm font-medium text-gray-300"
              >
                AWS Secret:
              </label>
              <input
                type="password"
                id={`aws-secret-${profile.name}`}
                value={profile.secretAccessKey}
                onChange={(e) =>
                  updateProfile(profile.name, "secretAccessKey", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        ))}

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        <div className="mb-4">
          <label
            htmlFor="new-profile-name"
            className="block text-sm font-medium text-gray-300"
          >
            New Profile Name:
          </label>
          <input
            type="text"
            id="new-profile-name"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <button
          onClick={addProfile}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add New AWS Profile
        </button>
      </div>
    </div>
  );
};
