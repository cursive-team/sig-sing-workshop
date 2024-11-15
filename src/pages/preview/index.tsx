import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  deleteAccountFromLocalStorage,
  fetchUserByUUID,
  getKeys,
  getLocationSignatures,
  getProfile,
  getUsers,
  User,
} from "@/lib/client/localStorage";
import {
  AppBackHeader,
  AppHeader,
  AppHeaderContent,
} from "@/components/AppHeader";
import { Card } from "@/components/cards/Card";
import Link from "next/link";
import { classed } from "@tw-classed/react";
import { labelStartWith, removeLabelStartWith } from "@/lib/shared/utils";
import { InputWrapper } from "@/components/input/InputWrapper";
import { ArtworkSnapshot } from "@/components/artwork/ArtworkSnapshot";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/client/realtime";
import { toast } from "sonner";
import { generateSelfBitVector, psiBlobUploadClient } from "@/lib/client/psi";
import init, { round1_js, round2_js, round3_js } from "@/lib/mp_psi/mp_psi";
import { encryptOverlapComputedMessage } from "@/lib/client/jubSignal/overlapComputed";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { CircleCard } from "@/components/cards/CircleCard";
import { IconCircle } from "@/components/IconCircle";
import { ProfilePicModal } from "@/components/modals/ProfilePicModal";
import useSettings from "@/hooks/useSettings";
import { Accordion } from "@/components/Accordion";
import { cn, handleUsername } from "@/lib/client/utils";
import { Icons } from "@/components/Icons";
import { logClientEvent } from "@/lib/client/metrics";

const Label = classed.span("text-sm text-gray-12");

interface LinkCardProps {
  label?: string;
  href: string;
  value?: string;
}

const LinkCard = ({ label, value, href }: LinkCardProps) => {
  return (
    <Link href={href} target="_blank">
      <div className="grid items-center grid-cols-[auto_1fr_auto] gap-1">
        <span className="text-iron-950 font-normal">{label}</span>
        <div className="h-[1px] bg-iron-200 w-full"></div>
        <span className="text-right">{handleUsername(value) ?? "N/A"}</span>
      </div>
    </Link>
  );
};

const UserProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const alreadyConnected = router?.query?.alreadyConnected === "true";
  const [showProfilePicModal, setShowProfilePicModal] =
    useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { pageWidth } = useSettings();

  const handleSignout = () => {
    deleteAccountFromLocalStorage();
    supabase.auth.signOut();
    window.location.href = "/register";
  };

  useEffect(() => {
    const fetchedUser = fetchUserByUUID("0");
    const bioMatch = fetchedUser?.bio?.match(/^@(.*)\|/);
    const realTg = bioMatch ? bioMatch[1] : null;
    const actualBio = bioMatch
      ? fetchedUser?.bio?.substring(bioMatch[0].length)
      : fetchedUser?.bio;

    if (fetchedUser) {
      fetchedUser.bio = actualBio ?? undefined;
      fetchedUser.fc = realTg ?? undefined;
    }

    setUser(fetchedUser);
  }, [router]);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <div
        className={cn("flex w-full items-center py-5 z-50", {
          "bg-main": isMenuOpen,
          "bg-transparent": !isMenuOpen,
        })}
      >
        {!isMenuOpen && (
          <button type="button" className="flex gap-2 items-center">
            <Icons.Logo className="text-iron-950" />
          </button>
        )}
        <div className="flex gap-4 items-center ml-auto">
          <span className="text-primary">{isMenuOpen && "Close"}</span>
          <button
            className="text-iron-950"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <Icons.Close className="text-primary" />
            ) : (
              <Icons.Burgher className="text-primary" />
            )}
          </button>
          <AppHeaderContent
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            handleSignout={handleSignout}
            isPreview={true}
          />
        </div>
      </div>
      <ProfilePicModal
        isOpen={showProfilePicModal}
        setIsOpen={setShowProfilePicModal}
        size={pageWidth - 60}
        name={user.name}
        pubKey={user.sigPk ?? ""}
      />
      {alreadyConnected && (
        <div className="flex items-start justify-center py-28">
          <span className="text-xl text-iron-950">
            You have already connected with this user!
          </span>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 xs:gap-5 items-center">
          <div
            onClick={() => {
              logClientEvent("artShowProfilePicModal", {});
              setShowProfilePicModal(true);
            }}
            className="w-32 h-32 rounded-[4px] relative flex-shrink-0"
          >
            <ArtworkSnapshot
              width={128}
              height={128}
              pubKey={user.sigPk ?? ""}
            />
            <button type="button" className="absolute right-1 top-1 z-1">
              <Icons.Zoom />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-iron-950 font-medium">{user.name}</h2>
            <div className="flex items-center gap-1">
              {user.bio && (
                <span
                  className="font-iron-950 text-[12px] font-normal mt-1 left-5"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {user.bio}
                </span>
              )}
            </div>
          </div>
        </div>
        {!user.inTs && (
          <div className="p-3 bg-tertiary rounded flex-col justify-center items-start gap-1 inline-flex">
            <InputWrapper
              className="flex flex-col gap-2"
              label="Details pending"
            >
              <span className="text-iron-600 font-sans text-[14px] left-5 mt-1">
                If {user.name} taps you back and shares their socials, they will
                appear here.
              </span>
            </InputWrapper>
          </div>
        )}

        {user?.isSpeaker && (
          <div className="flex flex-col p-3 bg-secondary rounded">
            <span className="font-sans text-sm font-semibold leading-6 text-white">
              Workshop Speaker
            </span>
          </div>
        )}

        {user?.note && (
          <Accordion label="Notes">
            <span className="text-iron-600 text-[14px] mt-1 left-5">
              {user?.note}
            </span>
          </Accordion>
        )}

        {(user.x || user.tg || user.fc) && (
          <Accordion label="Socials">
            <div className="flex flex-col gap-1">
              {(user.x?.length ?? 0) > 1 && (
                <LinkCard
                  label="Twitter"
                  href={`https://x.com/${removeLabelStartWith(user.x, "@")}`}
                  value={labelStartWith(user.x, "@")}
                />
              )}
              {(user.fc?.length ?? 0) > 1 && (
                <LinkCard
                  label="Telegram"
                  href={`https://t.me/${removeLabelStartWith(user.fc, "@")}`}
                  value={labelStartWith(user.fc, "@")}
                />
              )}
              {(user.tg?.length ?? 0) > 1 && (
                <LinkCard
                  label="Daimo"
                  href={`https://daimo.com/l/account/${removeLabelStartWith(
                    user.tg,
                    "@"
                  )}`}
                  value={labelStartWith(user.tg, "@")}
                />
              )}
            </div>
          </Accordion>
        )}
        <Button variant="white" onClick={handleSignout}>
          <div className="flex w-full items-center justify-between">
            <span className="text-iron-600 font-semibold text-xs">
              Register and retap NFC to backup socials
            </span>
            <Icons.ExternalLink className="text-gray-10" />
          </div>
        </Button>
      </div>
    </div>
  );
};

UserProfilePage.getInitialProps = () => {
  return { showHeader: false, showFooter: false };
};

export default UserProfilePage;
