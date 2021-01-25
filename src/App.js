import React, { useState, useEffect } from "react";
import Radio from "@material-ui/core/Radio";
import Checkbox from "@material-ui/core/Checkbox";
import { vonageSubscribedMinutesCost } from "./Vonage";
import "./styles.css";

const EIGHT_HOUR_IN_MINS = 60 * 8;
const COMMUNICATION_CHANNELS_PER_USER = 3;
const ONE_MILLION = 1000000;
const VIDEO_SIZE_BY_HOUR_IN_GB = 1;

const MESSAGING = [
  {
    id: "vonageMessages",
    label: "Vonage (included w Vonage streaming)",

    cost: () => {
      return {
        fixed: 0,
        day: 0
      };
    },
    link: "https://www.vonage.com/communications-apis/video/pricing/"
  },
  {
    id: "pusher",
    label: "Pusher",

    cost: ({ mpm, users, smpm, eventDurationMins }) => {
      const tiers = (mpd, conn) => {
        const ONE_MILLION = 1000000;
        if (mpd < ONE_MILLION && conn < 500) return 49;
        if (mpd < 4 * ONE_MILLION && conn < 2000) return 99;
        if (mpd < 10 * ONE_MILLION && conn < 5000) return 299;
        if (mpd < 20 * ONE_MILLION && conn < 10 * 1000) return 499;
        if (mpd < 40 * ONE_MILLION && conn < 15 * 1000) return 699;
        if (mpd < 60 * ONE_MILLION && conn < 20 * 1000) return 699;
        if (mpd < 90 * ONE_MILLION && conn < 30 * 1000) return 1199;
        throw new Error('No plan on "Pusher" cover this setup.');
      };
      const messagesPerDay = (mpm + smpm) * users * eventDurationMins;
      const connections = users * COMMUNICATION_CHANNELS_PER_USER;
      const t = tiers(messagesPerDay, connections);
      return {
        fixed: t,
        day: 0
      };
    },
    link: "https://pusher.com/channels/pricing"
  },
  {
    id: "fanout",
    label: "Fanout",
    cost: ({ mpm, smpm, users, eventDurationMins }) => {
      const totalMinutes =
        users * COMMUNICATION_CHANNELS_PER_USER * eventDurationMins;
      const totalMessages = (smpm + mpm) * users * eventDurationMins;
      return {
        fixed: 0,
        day:
          25 +
          (totalMinutes / ONE_MILLION) * 4 +
          (totalMessages / ONE_MILLION) * 4
      };
    },
    link: "https://fanout.io/pricing/"
  },

  {
    id: "cloudamqp",
    label: "CloudAMQP",

    cost: ({ mpm, users, smpm }) => {
      const tiers = (mbs, conn) => {
        const ONE_TH = 1000;
        if (mbs < 10 * ONE_TH && conn < 4 * ONE_TH) return 299;
        if (mbs < 20 * ONE_TH && conn < 10 * ONE_TH) return 499;
        if (mbs < 50 * ONE_TH && conn < 20 * ONE_TH) return 999;
        if (mbs < 100 * ONE_TH && conn < 40 * ONE_TH) return 1999;
        if (mbs < 200 * ONE_TH && conn < 80 * ONE_TH) return 3499;
        throw new Error('No plan on "CloudAMQP" cover this setup.');
      };
      const messageBySeconds = ((mpm + smpm) * users) / 60;
      const connections = users;
      const t = tiers(messageBySeconds, connections);
      return {
        fixed: t,
        day: 0
      };
    },
    link: "https://www.cloudamqp.com/plans.html"
  },
  {
    id: "rabbitmq",
    label: "RabbitMQ (self-managed)",

    cost: ({ mpm, users, smpm }) => {
      const tiers = (mbs, conn) => {
        const ONE_TH = 1000;
        if (mbs < 4500 && conn < ONE_TH) return 40;
        if (mbs < 2 * 4500 && conn < 2 * ONE_TH) return 2 * 40;
        if (mbs < 5 * 4500 && conn < 5 * ONE_TH) return 5 * 40;
        if (mbs < 10 * 4500 && conn < 10 * ONE_TH) return 10 * 40;
        throw new Error('No plan on "RabbitMQ" cover this setup.');
      };
      const messageBySeconds = ((mpm + smpm) * users) / 60;
      const connections = users;
      const t = tiers(messageBySeconds, connections);
      return {
        fixed: t,
        day: 0
      };
    }
  }
];

const VIDEO_STREAMING = [
  {
    id: "vonagestreaming",
    label: "Vonage (studio)",
    cost: ({ tracks, eventDurationMins, users, panelSize }) => {
      const panelMinuteSubscribed =
        tracks * (eventDurationMins * (panelSize * (panelSize - 1)));
      const panelCost = vonageSubscribedMinutesCost(
        panelMinuteSubscribed,
        true
      );
      const minutesSubscribed = users * eventDurationMins;
      const minutesStreamedPrice = eventDurationMins * 0.07;
      const streamingCost = minutesSubscribed * 0.005 + minutesStreamedPrice;
      return {
        day: streamingCost + panelCost,
        fixed: 0
      };
    },
    link: "https://www.vonage.com/communications-apis/video/pricing/"
  },

  {
    id: "vonagemux",
    label: "Vonage + Mux (studio)",
    cost: ({ tracks, eventDurationMins, users, panelSize }) => {
      const panelMinuteSubscribed =
        tracks * (eventDurationMins * (panelSize * (panelSize - 1)));
      const panelCost = vonageSubscribedMinutesCost(
        panelMinuteSubscribed,
        true
      );
      const minutesSubscribed = users * eventDurationMins;
      const minutesStreamedVonagePrice = eventDurationMins * 0.1;
      const minutesStreamedMuxPrice = eventDurationMins * 0.07;
      const streamingCost =
        minutesSubscribed * 0.0013 +
        minutesStreamedVonagePrice +
        minutesStreamedMuxPrice;
      return {
        day: streamingCost + panelCost,
        fixed: 0
      };
    },
    link: "https://www.mux.com/pricing?view=live"
  },

  {
    id: "jwplayer",
    label: "JW Player",
    cost: ({ tracks, eventDurationMins, users }) => {
      const minutesSubscribed = users * eventDurationMins;
      return {
        day: (minutesSubscribed / 1000) * 4.5,
        fixed: 0
      };
    },
    link: "https://www.jwplayer.com/pricing/"
  },
  {
    id: "fastly",
    label: "Fastly",
    cost: ({ tracks, eventDurationMins, users }) => {
      const bandwidthTiers = (GB) => {
        if (GB < 10000) {
          return GB * 0.12;
        }
        return 10000 * 0.12 + (GB - 10000) * 0.08;
      };
      const hoursSubscribed = (users * eventDurationMins) / 60;
      const GB = VIDEO_SIZE_BY_HOUR_IN_GB * hoursSubscribed;
      const day = bandwidthTiers(GB);
      return {
        day: Math.max(0, day - 50),
        fixed: 50
      };
    },
    link: "https://www.fastly.com/pricing"
  },
  {
    id: "cloudflare",
    label: (
      <>
        Cloudflare Streaming<sup>*1</sup>
      </>
    ),
    cost: ({ mpm, users, tracks, eventDurationMins }) => {
      const streamedMinutes = users * eventDurationMins;
      const savedMinutes = tracks * eventDurationMins;
      return {
        fixed: 0,
        day: streamedMinutes / 1000 + (savedMinutes / 1000) * 5
      };
    },
    link: "https://www.cloudflare.com/products/cloudflare-stream/"
  },
  {
    id: "vimeo",
    label: "Vimeo",
    cost: ({ mpm, users, tracks }) => {
      const fixed = tracks * 70;
      return {
        fixed,
        day: 0
      };
    },
    // disabled: true,
    link: "https://www.cloudflare.com/products/cloudflare-stream/"
  },
  {
    id: "aws",
    label: "AWS streaming",
    cost: ({ mpm, users }) => {
      const priceByUser = 757 / 5000;
      const cost = priceByUser * users * 8;
      return {
        day: cost,
        fixed: 0
      };
    },
    disabled: false,
    link: "https://aws.amazon.com/it/solutions/live-streaming-on-aws/"
  },
  {
    id: "azure",
    label: "Azure streaming",
    cost: ({ tracks, eventDurationMins, users }) => {
      const bandwidthTiers = (GB) => {
        if (GB < 5) {
          return 0;
        }
        if (GB < 10 * 1000) {
          return (GB - 5) * 0.087;
        }
        if (GB < 10 * 1000 + 40 * 1000) {
          return 5 * 1000 * 0.087 + (GB - 15000) * 0.083;
        }
        if (GB < 10 * 1000 + 40 * 1000 + 100 * 1000) {
          return 5 * 1000 * 0.087 + 40000 * 0.083 + (GB - 50000) * 0.07;
        }
        throw new Error(
          `There is no tier for ${GB.toLocaleString(
            "en"
          )} in Azure (incomplete, see pricing link and update code)`
        );
      };
      const liveMinutes = tracks * eventDurationMins;
      const mediaServiceCost = liveMinutes * 0.0397;
      const subscribedHours = (users * eventDurationMins) / 60;
      const GB = subscribedHours * VIDEO_SIZE_BY_HOUR_IN_GB * users;
      const day = mediaServiceCost + bandwidthTiers(GB);
      return {
        day,
        fixed: 0
      };
    },
    disabled: false,
    link: "https://azure.microsoft.com/en-us/pricing/details/media-services/"
  },

  {
    id: "wowza",
    label: "Wowza",
    disabled: false,
    cost: ({ tracks, eventDurationMins, users }) => {
      const transcodingTiers = (hours) => {
        if (hours < 10) {
          return 6 * hours;
        }
        if (hours < 10 + 20) {
          return 6 * 10 + (hours - 10) * 5.5;
        }
        if (hours < 30 + 20) {
          return 6 * 10 + 20 * 5.5 + (hours - 30) * 5;
        }
        throw new Error(
          `Wowza has no plan for ${hours} hours of live streaming (transcoding).
          Note this tiers is still incomplete, fix it`
        );
      };

      const passThroughTiers = (hours) => {
        if (hours < 100) {
          return 0.15 * hours;
        }
        if (hours < 100 + 900) {
          return 0.15 * 100 + (hours - 100) * 0.13;
        }
        if (hours < 1000 + 2000) {
          return 0.15 * 100 + 900 * 0.13 + (hours - 1000) * 0.12;
        }
        throw new Error(
          `Wowza has no plan for ${hours} hours of live streaming (passthrough).
          Note this tiers is still incomplete, fix it`
        );
      };

      const CDNTiers = (hours, users) => {
        const GB = hours * VIDEO_SIZE_BY_HOUR_IN_GB * users;
        if (GB < 100) {
          return 0.095 * GB;
        }
        if (GB < 100 + 900) {
          return 0.095 * 100 + (GB - 100) * 0.09;
        }
        if (GB < 1000 + 1500) {
          return 0.095 * 100 + 0.09 * 900 + (GB - 1000) * 0.085;
        }
        if (GB < 2500 + 7500) {
          return 0.095 * 100 + 0.09 * 900 + 0.085 * 1500 + (GB - 2500) * 0.077;
        }
        throw new Error(
          `Wowza has no plan for ${GB} GB of live streaming (CDN).
          Note this tiers is still incomplete, fix it`
        );
      };

      const EgressTiers = (hours) => {
        const GB = hours * VIDEO_SIZE_BY_HOUR_IN_GB;
        if (GB < 100) {
          return 0.3 * GB;
        }
        if (GB < 100 + 400) {
          return 0.3 * 100 + (GB - 100) * 0.28;
        }
        if (GB < 500 + 500) {
          return 0.3 * 100 + 0.28 * 400 + (GB - 500) * 0.26;
        }
        if (GB < 1000 + 1000) {
          return 0.3 * 100 + 0.28 * 400 + 0.26 * 500 + (GB - 1000) * 0.25;
        }
        throw new Error(
          `Wowza has no plan for ${GB} GB of live streaming (Egress).
          Note this tiers is still incomplete, fix it`
        );
      };

      const videoHours = (eventDurationMins * tracks) / 60;
      const day =
        transcodingTiers(videoHours) +
        passThroughTiers(videoHours) +
        CDNTiers(videoHours / tracks, users) +
        EgressTiers(videoHours);
      const fixed = 15;
      return {
        day,
        fixed
      };
    },
    link: "https://www.wowza.com/pricing/streaming-cloud-plans/service-provider"
  }
];

const API = [
  {
    id: "vercel",
    label: "Vercel (Zeit)",
    cost: ({ mpm, users }) => ({
      day: 0,
      fixed: 40
    }),
    link: "https://vercel.com/pricing"
  },
  {
    id: "cloudflare",
    label: "Cloudflare Worker",
    cost: ({ mpm, users, eventDurationMins }) => {
      const fixedActions = 100;
      const messageActions = mpm * users * eventDurationMins;
      const total = messageActions + fixedActions;
      return {
        day: Math.max(5, (total / ONE_MILLION) * 0.5),
        fixed: 0
      };
    },
    link: "https://developers.cloudflare.com/workers/about/pricing/"
  },
  {
    id: "lambda",
    label: "AWS lambda",
    cost: ({ mpm, users, eventDurationMins }) => {
      const fixedActions = 100;
      const messageActions = mpm * users * eventDurationMins;
      const total = messageActions + fixedActions;
      const GBS = (total * 512) / 1024 - 400000;
      const priceGBS = Math.max(0, GBS * 0.00001667);
      const priceRequests =
        (Math.max(0, total - ONE_MILLION) / ONE_MILLION) * 0.2;

      return {
        day: priceGBS + priceRequests,
        fixed: 0
      };
    },
    link: "https://aws.amazon.com/lambda/pricing/"
  },
  {
    id: "lambda@edge",
    label: "AWS lambda@edge",
    cost: ({ mpm, users, eventDurationMins }) => {
      const fixedActions = 100;
      const messageActions = mpm * users * eventDurationMins;
      const total = messageActions + fixedActions;
      const GBS = (total * 512) / 1024;
      const priceGBS = Math.max(0, GBS * 0.00005001);
      const priceRequests = (Math.max(0, total) / ONE_MILLION) * 0.6;

      return {
        day: priceGBS + priceRequests,
        fixed: 0
      };
    },
    link: "https://aws.amazon.com/lambda/pricing/"
  }
];

const MEETING = [
  {
    id: "vonage_full",
    label: "Vonage (a/v, full price)",
    cost: ({
      mpm,
      users,
      meetingUsers,
      meetingMins,
      meetingsNr,
      eventDurationMins,
      face2faceMinutes,
      face2faceMeetingsNr
    }) => {
      const fixed = 9.99;
      const maxSubscibedMinutes = users * users * eventDurationMins;
      const groupChatMinutes =
        users * meetingsNr * meetingMins * (meetingUsers - 1);
      const face2FaceTotalSubMinutes =
        users * face2faceMeetingsNr * 2 * face2faceMinutes;
      const subscribedMinutes = Math.min(
        maxSubscibedMinutes,
        groupChatMinutes + face2FaceTotalSubMinutes
      );

      const day = vonageSubscribedMinutesCost(subscribedMinutes);

      return {
        day: day,
        fixed
      };
    },
    link: "https://www.vonage.com/communications-apis/video/pricing/"
  },
  {
    id: "vonage_audio_only",
    label: "Vonage (audio only, -60%)",
    cost: (opt) => {
      const { day, fixed } = MEETING.find((m) => m.id === "vonage_full").cost(
        opt
      );

      return {
        day: day * (1 - 0.6),
        fixed
      };
    },
    link: "https://www.vonage.com/communications-apis/video/pricing/"
  },
  {
    id: "twilio_p2p",
    label: (
      <>
        Twilio P2P
        <sup>
          <a href="#note2">*2</a>
        </sup>
      </>
    ),
    info:
      "10 user audio only, 2 users high quality video, 4 users low quality video",
    cost: ({
      users,
      meetingMins,
      meetingsNr,
      face2faceMinutes,
      face2faceMeetingsNr
    }) => {
      const twilioCostByMinute = 0.0015;
      const meetingMinutes = users * meetingsNr * meetingMins;
      const face2FaceTotalSubMinutes =
        users * face2faceMeetingsNr * face2faceMinutes;
      const day =
        (meetingMinutes + face2FaceTotalSubMinutes) * twilioCostByMinute;
      return {
        day
      };
    },
    link: "https://www.twilio.com/video/pricing"
  },
  {
    id: "twilio_groups",
    label: "Twilio Groups",
    info: "50 users max",
    cost: ({
      users,
      meetingMins,
      meetingsNr,
      face2faceMinutes,
      face2faceMeetingsNr
    }) => {
      const twilioCostByMinute = 0.004;
      const meetingMinutes = users * meetingsNr * meetingMins;
      const face2FaceTotalSubMinutes =
        users * face2faceMeetingsNr * face2faceMinutes;
      const day =
        (meetingMinutes + face2FaceTotalSubMinutes) * twilioCostByMinute;
      return {
        day
      };
    },
    link: "https://www.twilio.com/video/pricing"
  },
  {
    id: "agora_audio",
    label: <>Agora (audio only)</>,
    cost: ({
      users,
      meetingMins,
      meetingsNr,
      face2faceMinutes,
      face2faceMeetingsNr
    }) => {
      const agoraCostByMinute = 0.00099;
      const meetingMinutes = users * meetingsNr * meetingMins;
      const face2FaceTotalSubMinutes =
        users * face2faceMeetingsNr * face2faceMinutes;
      const day =
        (meetingMinutes + face2FaceTotalSubMinutes) * agoraCostByMinute;
      return {
        day
      };
    },
    link: "https://www.agora.io/en/pricing/"
  },
  {
    id: "custom",
    label: "Custom",
    cost: ({ mpm, users }) => 60,
    disabled: true
  }
];

const MONITORING = [
  {
    id: "datadog",
    label: "DataDog",
    cost: ({ mpm, users }) => 100,
    disabled: true
  },
  {
    id: "logrocket",
    label: "LogRocket",
    cost: ({ mpm, users }) => ({
      fixed: 99,
      day: 0
    })
  },
  {
    id: "sentry",
    label: "Sentry",
    cost: ({ mpm, users }) => 100,
    disabled: true
  }
];

const STORAGE = [
  {
    id: "digitalocean",
    label: "Digital Ocean",
    cost: ({ users }) => {
      const MBTransferredByUser = 5;
      const costTransferred =
        Math.max(0, (MBTransferredByUser * users) / 1024 - 1024 * 1024) * 0.01;
      return { fixed: 5, day: costTransferred };
    },
    link: "https://www.digitalocean.com/pricing/#Storage"
  }
];

const DB = [
  {
    id: "none",
    label: "None",
    cost: () => ({
      fixed: 0,
      day: 0
    })
  },
  {
    id: "mongodb",
    label: "MongoDB",
    cost: () => ({
      fixed: 120,
      day: 0
    }),
    link: "https://www.mongodb.com/cloud/atlas/pricing"
  }
];

const precision = (num, digits = 2) => {
  if (digits === 0) return Math.floor(num);
  const mult = 10 ** digits;
  return Math.trunc(num * mult) / mult;
};

export default function App() {
  const [error, setError] = useState(null);
  const [eventDuration, setEventDuration] = useState(8);
  const [messaging, setMessaging] = useState(MESSAGING[0].id);
  const [video, setVideo] = useState(VIDEO_STREAMING[0].id);
  const [meeting, setMeeting] = useState(MEETING[0].id);
  const [api, setApi] = useState(API[0].id);
  const [storage, setStorage] = useState(STORAGE[0].id);
  const [db, setDB] = useState(DB[1].id);
  const [monitoring, setMonitoring] = useState([]);
  const [users, setUsers] = useState(100);
  const [mpm, setMpm] = useState(20);
  const [smpm, setSmpm] = useState(10);
  const [meetingMins, setMeetingMins] = useState(40);
  const [meetingUsers, setMeetingUsers] = useState(5);
  const [meetingsNr, setMeetingNr] = useState(0.5);
  const [face2faceMinutes, setFace2faceMinutes] = useState(0);
  const [face2faceMeetingsNr, setFace2faceMeetingsNr] = useState(1);
  const [tracks, setTracks] = useState(1);
  const [panelSize, setPanelSize] = useState(1);
  const [savedCosts, setSavedCosts] = useState([]);
  const [savedTitle, setSavedTitle] = useState("");

  const [costs, setCosts] = useState({
    messaging: { day: 0, fixed: 0 },
    video: { day: 0, fixed: 0 },
    api: { day: 0, fixed: 0 },
    meeting: { day: 0, fixed: 0 },
    storage: { day: 0, fixed: 0 },
    db: { day: 0, fixed: 0 },
    monitoring: { day: 0, fixed: 0 }
  });

  useEffect(() => {
    const costOptions = {
      mpm: parseInt(mpm, 10),
      users: parseInt(users, 10),
      tracks: parseInt(tracks, 10),
      smpm: parseInt(smpm, 10),
      meetingMins: parseInt(meetingMins, 10),
      meetingUsers: parseInt(meetingUsers, 10),
      meetingsNr: parseFloat(meetingsNr, 10),
      face2faceMinutes: parseInt(face2faceMinutes, 10),
      face2faceMeetingsNr: parseFloat(face2faceMeetingsNr, 10),
      eventDurationMins: parseInt(eventDuration * 60, 10),
      panelSize: parseInt(panelSize, 10)
    };
    try {
      setCosts({
        messaging: MESSAGING.find((m) => m.id === messaging).cost(costOptions),
        video: VIDEO_STREAMING.find((v) => v.id === video).cost(costOptions),
        api: API.find((a) => a.id === api).cost(costOptions),
        meeting: MEETING.find((m) => m.id === meeting).cost(costOptions),
        storage: STORAGE.find((s) => s.id === storage).cost(costOptions),
        db: DB.find((d) => d.id === db).cost(costOptions),
        monitoring: Object.values(MONITORING).reduce(
          (acc, m) => {
            if (!(monitoring.indexOf(m.id) !== -1)) {
              return acc;
            }
            const cost = m.cost(costOptions);
            return {
              fixed: acc.fixed + cost.fixed,
              day: acc.day + cost.day
            };
          },
          { fixed: 0, day: 0 }
        )
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [
    api,
    db,
    eventDuration,
    face2faceMeetingsNr,
    face2faceMinutes,
    meeting,
    meetingMins,
    meetingsNr,
    meetingUsers,
    messaging,
    monitoring,
    mpm,
    panelSize,
    smpm,
    storage,
    tracks,
    users,
    video
  ]);

  const totalByDay = precision(
    Object.values(costs).reduce((acc, i) => acc + (i.day || 0), 0)
  );
  const totalByMonth = precision(
    Object.values(costs).reduce((acc, i) => acc + (i.fixed || 0), 0)
  );
  const totalByUser = precision((totalByDay + totalByMonth / 30) / users);

  const totalCommercial = precision(totalByUser * users * 5);

  const costLabel = (c) => {
    return `${precision(c.day)}$/day 
    ${c.fixed > 0 ? "(" + precision(c.fixed) + "$/month)" : ""}`;
  };

  return (
    <div className="App">
      <h1>HSay@next calculator</h1>
      <div className="grid">
        <div className="options">
          <section>
            <h3>API</h3>
            {API.map((a) => (
              <label key={a.id}>
                <Radio
                  value={a.id}
                  name="api"
                  checked={api === a.id}
                  onChange={(e) => setApi(e.target.value)}
                  disabled={a.disabled}
                />
                {a.label}
                {a.link ? (
                  <a href={a.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
          <section>
            <h3>Messaging</h3>
            {MESSAGING.map((m) => (
              <label key={m.id}>
                <Radio
                  value={m.id}
                  name="messaging"
                  checked={messaging === m.id}
                  onChange={(e) => setMessaging(e.target.value)}
                  disabled={m.disabled}
                />
                {m.label}
                {m.link ? (
                  <a href={m.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
          <section>
            <h3>Video streaming</h3>
            {VIDEO_STREAMING.map((v) => (
              <label key={v.id}>
                <Radio
                  type="radio"
                  value={v.id}
                  name="video"
                  checked={video === v.id}
                  onChange={(e) => setVideo(e.target.value)}
                  disabled={v.disabled}
                />
                {v.label}
                {v.link ? (
                  <a href={v.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>

          <section>
            <h3>Audio/Video meetings</h3>
            {MEETING.map((m) => (
              <label key={m.id} title={m.info}>
                <Radio
                  type="radio"
                  value={m.id}
                  name="meeting"
                  checked={meeting === m.id}
                  onChange={(e) => setMeeting(e.target.value)}
                  disabled={m.disabled}
                />
                {m.label}
                {m.link ? (
                  <a href={m.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
          <section>
            <h3>Storage</h3>
            {STORAGE.map((item) => (
              <label key={item.id}>
                <Radio
                  type="radio"
                  value={item.id}
                  name="storage"
                  checked={storage === item.id}
                  onChange={(e) => setStorage(e.target.value)}
                  disabled={item.disabled}
                />
                {item.label}
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
          <section>
            <h3>Database</h3>
            {DB.map((item) => (
              <label key={item.id}>
                <Radio
                  type="radio"
                  value={item.id}
                  name="storage"
                  checked={db === item.id}
                  onChange={(e) => setDB(e.target.value)}
                  disabled={item.disabled}
                />
                {item.label}
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
          <section>
            <h3>Monitoring</h3>
            {MONITORING.map((m) => (
              <label key={m.id}>
                <Checkbox
                  value={m.id}
                  checked={monitoring.indexOf(m.id) !== -1}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMonitoring((monit) => [...monit, m.id]);
                    } else {
                      setMonitoring((monit) => {
                        const index = monit.indexOf(m.id);
                        return [
                          ...monit.slice(0, index),
                          ...monit.slice(index + 1)
                        ];
                      });
                    }
                  }}
                  disabled={m.disabled}
                />
                {m.label}
                {m.link ? (
                  <a href={m.link} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-square-alt" />
                  </a>
                ) : null}
              </label>
            ))}
          </section>
        </div>
        <div className="traffic">
          {/* <h2>Traffic values</h2> */}
          <div className="traffic-boxes">
            <section>
              <h3>Users & Event</h3>
              <label className="parameter">
                Users:&nbsp;
                <div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    list="usersCount"
                    step="100"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                  />
                  <input
                    type="number"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                    min={0}
                    step={100}
                    style={{ maxWidth: "80px" }}
                  />
                  {/*users*/}
                  <datalist id="usersCount">
                    <option value="100" />
                    <option value="200" />
                    <option value="500" />
                    <option value="1000" />
                    <option value="2000" />
                    <option value="3000" />
                    <option value="4000" />
                    <option value="5000" />
                  </datalist>
                </div>
              </label>
              <label className="parameter">
                Event duration&nbsp;
                <div>
                  <input
                    type="number"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    min={1}
                    max={24}
                  />
                  &nbsp;hours
                </div>
              </label>
            </section>
            <section>
              <h3>Realtime messages</h3>
              <label className="parameter">
                Message by user per minute:&nbsp;
                <input
                  type="number"
                  value={mpm}
                  onChange={(e) => setMpm(e.target.value)}
                  min={0}
                />
              </label>

              <label className="parameter">
                System messages per minute:&nbsp;
                <input
                  type="number"
                  value={smpm}
                  onChange={(e) => setSmpm(e.target.value)}
                  min={0}
                />
              </label>
            </section>
            <section>
              <h3>FrontRow (audio only)</h3>
              <small>
                Truncated to{" "}
                {(users * users * EIGHT_HOUR_IN_MINS).toLocaleString("en")}{" "}
                minutes
              </small>
              <label className="parameter">
                Avg. Meeting minutes:&nbsp;
                <input
                  type="number"
                  value={meetingMins}
                  onChange={(e) => setMeetingMins(e.target.value)}
                  min={0}
                />
              </label>

              <label className="parameter">
                Avg. Meeting participants:&nbsp;
                <input
                  type="number"
                  value={meetingUsers}
                  onChange={(e) => setMeetingUsers(e.target.value)}
                  min={0}
                />
              </label>

              <label className="parameter">
                Avg. meetings per user:&nbsp;
                <input
                  type="number"
                  value={meetingsNr}
                  onChange={(e) => setMeetingNr(e.target.value)}
                  min={0}
                  step={0.1}
                />
              </label>
              <small>
                This means ~{Math.floor(users * meetingsNr)} users are involved
                in chats (frontrows, room A/V chats) in groups of {meetingUsers}{" "}
                people, for the duration of {meetingMins} minutes each on
                average.
              </small>
            </section>
            <section>
              <h3>Face to face A/V</h3>
              <small>
                Truncated to{" "}
                {(users * users * EIGHT_HOUR_IN_MINS).toLocaleString("en")}{" "}
                minutes
              </small>
              <label className="parameter">
                Avg. Meeting minutes:&nbsp;
                <input
                  type="number"
                  value={face2faceMinutes}
                  onChange={(e) => setFace2faceMinutes(e.target.value)}
                  min={0}
                />
              </label>

              <label className="parameter">
                Avg. meetings per user:&nbsp;
                <input
                  type="number"
                  value={face2faceMeetingsNr}
                  onChange={(e) => setFace2faceMeetingsNr(e.target.value)}
                  min={0}
                  step={0.1}
                />
              </label>
            </section>
            <section>
              <h3>Video streams</h3>

              <label className="parameter">
                Parallel video tracks:&nbsp;
                <input
                  type="number"
                  value={tracks}
                  onChange={(e) => setTracks(e.target.value)}
                />
              </label>

              <label className="parameter">
                Panel size:&nbsp;
                <input
                  type="number"
                  value={panelSize}
                  onChange={(e) => setPanelSize(e.target.value)}
                />
              </label>
            </section>
          </div>
        </div>
        <section className="costs">
          {error ? (
            <div style={{ color: "red", marginTop: "1em" }}>
              <h2>Cost</h2>
              {error}
            </div>
          ) : (
            <div>
              <h2>Cost</h2>
              <p>
                <span>Api:</span> <span>{costLabel(costs.api)}</span>
              </p>
              <p>
                <span>Messaging:</span>{" "}
                <span>{costLabel(costs.messaging)}</span>
              </p>
              <p>
                <span>Video streaming:</span>
                <span>{costLabel(costs.video)}</span>
              </p>
              <p>
                <span>Meetings:</span> <span>{costLabel(costs.meeting)}</span>
              </p>
              <p>
                <span>Storage:</span> <span>{costLabel(costs.storage)}</span>
              </p>
              <p>
                <span>Database:</span> <span>{costLabel(costs.db)}</span>
              </p>
              <p>
                <span>Monitoring:</span>{" "}
                <span>{costLabel(costs.monitoring)}</span>
              </p>
              <hr />
              <p>
                <strong>Total by day (event) </strong>${totalByDay}
                /day
              </p>
              <p>
                <strong>Fixed by month </strong>${totalByMonth}
                /month
              </p>

              <p>
                <strong>Cost by user </strong>${totalByUser}
                /user
              </p>

              <p>
                <strong>Commercial (5x) </strong>${totalCommercial}
                /event
              </p>
              <input
                type="text"
                value={savedTitle}
                onChange={(e) => setSavedTitle(e.target.value)}
              />
              <button
                onClick={() => {
                  setSavedCosts((sc) => [
                    ...sc,
                    {
                      title: savedTitle,
                      api,
                      meeting,
                      meetingMins,
                      meetingUsers,
                      meetingsNr,
                      messaging,
                      mpm,
                      smpm,
                      totalByDay,
                      totalByMonth,
                      totalByUser,
                      totalCommercial,
                      tracks,
                      users,
                      video,
                      storage
                    }
                  ]);
                  setSavedTitle("");
                }}
              >
                Save
              </button>
            </div>
          )}
        </section>
      </div>
      <div style={{ textAlign: "left" }}>
        <p id="note2">
          <sup>*2</sup> More info about{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.twilio.com/docs/video/tutorials/understanding-video-rooms#which-room-should-I-use"
          >
            twilio room types
          </a>
        </p>
      </div>
      <div>
        <h1>Saved hypotesis</h1>
        {savedCosts.length > 0 ? (
          <button
            onClick={() => {
              const element = document.createElement("a");
              element.setAttribute(
                "href",
                "data:text/plain;charset=utf-8," +
                  encodeURIComponent(JSON.stringify(savedCosts, null, "  "))
              );
              element.setAttribute(
                "download",
                `Saved costs - ${new Date().toISOString()}.json`
              );

              element.style.display = "none";
              document.body.appendChild(element);

              element.click();

              document.body.removeChild(element);
            }}
          >
            Download
          </button>
        ) : null}
      </div>

      <div className="savedCosts">
        {savedCosts.map((sc, i) => (
          <div className="cost" key={"cost-" + i}>
            <i
              className="fas fa-times-circle close"
              onClick={() => {
                setSavedCosts((s) => [...s.slice(0, i), ...s.slice(i + 1)]);
              }}
            />
            <h3>{sc.title || `Hypothesis ${i + 1}`}</h3>
            <div className="choices">
              <div>
                <i className="fas fa-users" />
                <span>{sc.users}</span>
              </div>
              <div>
                <i className="fas fa-envelope" />
                <span>
                  {sc.mpm}+{sc.smpm}/min
                </span>
              </div>
              <div>
                <i className="fas fa-film" />
                <span>{sc.tracks} tracks</span>
              </div>
              <div>
                <i className="fas fa-comments" />
                <span>
                  {sc.meetingsNr} for {sc.meetingMins}min of {sc.meetingUsers}{" "}
                  people
                </span>
              </div>
            </div>
            <div>
              <ul>
                <li>Api: {API.find((a) => a.id === sc.api).label}</li>
                <li>
                  Live streaming:{" "}
                  {VIDEO_STREAMING.find((a) => a.id === sc.video).label}
                </li>
                <li>
                  Realtime comm:{" "}
                  {MESSAGING.find((a) => a.id === sc.messaging).label}
                </li>
                <li>
                  Video chat: {MEETING.find((a) => a.id === sc.meeting).label}
                </li>
                <li>
                  Storage: {STORAGE.find((s) => s.id === sc.storage).label}
                </li>
              </ul>
            </div>
            <div className="total">
              <p>
                Total by day: <strong>${sc.totalByDay}</strong>
              </p>
              <p>
                Fixed monthly cost: <strong>${sc.totalByMonth}</strong>
              </p>
              <p>
                By user: <strong>${sc.totalByUser}</strong>
              </p>
              <p>
                Commercial: <strong>${sc.totalCommercial}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
