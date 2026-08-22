import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SoundOfUsCard } from '../components/SoundOfUsCard'
import { HillDivider } from '../components/HillDivider'
import { PetalBlastCanvas } from '../components/PetalBlastCanvas'
import {
  apiRequest,
  reportPersistenceError,
  reportPersistenceSuccess,
} from '../lib/persistence'
import { compressImage } from '../lib/image'

export const Route = createFileRoute('/_main/home')({
  component: HomePage,
})

function HomePage() {
  const [heroImage, setHeroImage] = useState('/hero-couple.jpg')
  const [nickname, setNickname] = useState('Jaan')
  const [showGreeting, setShowGreeting] = useState(true)
  const [daysTogether, setDaysTogether] = useState(365)
  const [surpriseRevealed, setSurpriseRevealed] = useState(false)
  const [priorWish, setPriorWish] = useState<string | null>(null)
  const [wishInput, setWishInput] = useState('')
  const [wishSubmitted, setWishSubmitted] = useState(false)
  const [wishError, setWishError] = useState('')

  // Candle state
  const [candlesBlown, setCandlesBlown] = useState(false)
  const [candleHoldProgress, setCandleHoldProgress] = useState(0)

  // Royal Birthday Letter state
  const [isLetterSealed, setIsLetterSealed] = useState(true)
  const [triggerRoyalBlast, setTriggerRoyalBlast] = useState(false)
  const [letterPage, setLetterPage] = useState(0)

  // Daily deterministic sentence pool
  const dailySentences = [
    'wherever you are, I hope today is gentle',
    'still choosing you, on repeat',
    'you make the noise of the world turn quiet',
    'loving you is the easiest thing I do',
    'my favorite place is right next to you',
  ]

  const dayOfYear = Math.floor(
    (Date.now() -
      new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  )

  const todaySentence =
    dailySentences[dayOfYear % dailySentences.length]

  const persistState = async (
    key: string,
    value: boolean,
  ) => {
    try {
      await apiRequest('/api/dashboard-state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
        }),
      })

      reportPersistenceSuccess('Saved')
    } catch (error) {
      reportPersistenceError(error)
    }
  }

  useEffect(() => {
    // Hide greeting after 5s
    const timer = setTimeout(
      () => setShowGreeting(false),
      5000,
    )

    // Load data
    fetch('/api/home-hero')
      .then((r) => r.json())
      .then((d) => {
        if (d.imageUrl) setHeroImage(d.imageUrl)
      })
      .catch(() => {})

    fetch('/api/birthday-wishes')
      .then((r) => r.json())
      .then((d) => {
        if (d.wish) setPriorWish(d.wish)
      })
      .catch(() => {})

    fetch('/api/us/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.daysTogether)
          setDaysTogether(d.daysTogether)
      })
      .catch(() => {})

    fetch('/api/dashboard-state')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.candlesBlown === 'boolean') {
          setCandlesBlown(d.candlesBlown)
        }

        if (typeof d.letterOpened === 'boolean') {
          setIsLetterSealed(!d.letterOpened)
        }

        if (typeof d.surpriseRevealed === 'boolean') {
          setSurpriseRevealed(d.surpriseRevealed)
        }
      })
      .catch(() => {})

    fetch('/api/auth/get-session')
      .then((r) => r.json())
      .then((sess) => {
        const role = sess?.user?.role || 'Husband'

        fetch('/api/shared-meta/nickname')
          .then((r) => r.json())
          .then((d) => {
            const nick =
              role === 'Husband'
                ? d.husband_nickname
                : d.wife_nickname

            if (nick) setNickname(nick)
          })
          .catch(() => {})
      })
      .catch(() => {})

    return () => clearTimeout(timer)
  }, [])

  const handleHeroUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]

    if (!file) return

    void compressImage(file)
      .then(async (compressed) => {
        try {
          await apiRequest('/api/home-hero', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: compressed,
            }),
          })

          setHeroImage(compressed)
          reportPersistenceSuccess('Photo saved')
        } catch (error) {
          reportPersistenceError(error)
        }
      })
      .catch(reportPersistenceError)
  }

  // Candle hold press
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (
      candleHoldProgress > 0 &&
      candleHoldProgress < 100 &&
      !candlesBlown
    ) {
      interval = setInterval(() => {
        setCandleHoldProgress((prev) => {
          if (prev >= 95) {
            setCandlesBlown(true)
            void persistState('candlesBlown', true)

            clearInterval(interval)

            return 100
          }

          return prev + 5
        })
      }, 50)
    } else if (candleHoldProgress === 0) {
      setCandleHoldProgress(0)
    }

    return () => clearInterval(interval)
  }, [candleHoldProgress, candlesBlown])

  const handleWishSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (!wishInput.trim()) return

    setWishError('')

    try {
      await apiRequest('/api/birthday-wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: wishInput.trim(),
        }),
      })

      setWishSubmitted(true)
      setWishInput('')

      reportPersistenceSuccess('Wish saved')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Your wish could not be saved.'

      setWishError(message)

      reportPersistenceError(error)
    }
  }

  const handleUnsealRoyalLetter = () => {
    setTriggerRoyalBlast(true)
    setIsLetterSealed(false)
    setLetterPage(0)

    void persistState('letterOpened', true)
  }

  const goToNextPage = () => {
    if (letterPage < 3) {
      setLetterPage((prev) => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (letterPage > 0) {
      setLetterPage((prev) => prev - 1)
    }
  }

  const restartLetter = () => {
    setLetterPage(0)
  }

  const pageNumbers = ['I', 'II', 'III', 'IV']

  const letterPages = [
    // PAGE 1
    [
      `Happy Birthday, my love.`,

      `I could have written one of those normal birthday letters where I tell you that you're beautiful, amazing, special, and that I love you more than words can explain. But honestly? That would be a scam. Because our relationship has never been normal enough to deserve a normal letter.`,

      `So here's the real one.`,

      `First of all, I need to confess something very important: you are a tiny criminal. You randomly pinch my nipples, hit me on the head, and then look at me with that stupid puppy face mixed with an evil little smile, as if you have committed absolutely no crime. And somehow, instead of reporting you to the authorities, I stand there thinking, damn, she's cute. Which is honestly concerning for me.`,

      `And you being angry? Don't even get me started. Most boyfriends probably try to prevent their girlfriends from getting angry. Meanwhile, here I am, occasionally creating problems just so I can witness that angry little face because, unfortunately for you, your anger is adorable. Your baby voice is another problem. Sometimes you act so cute and completely insane that I genuinely wonder what is happening inside that head of yours, and then I remember that whatever is happening in there somehow led you to choose me, so maybe I shouldn't question it too much.`,

      `I think about you in the most random places too. Rain is one of them. Whenever it starts raining, somehow my brain quietly opens the "her" folder. And yes, I think about you after I take a shower too, standing there in nothing but a towel, realizing that apparently even a peaceful shower is not enough to stop my brain from thinking about you. That is honestly the problem with having a girlfriend like you. You have this ridiculous power to make me think about you no matter what mood I am in. I can be tired, irritated, stressed, half asleep, or having the worst day imaginable, and somehow one thought about you or one memory of kissing you can make my brain immediately abandon every other responsibility. It is honestly unfair. You somehow manage to be my comfort person and one of the biggest distractions in my life at the exact same time. That takes talent.`,

      `One of my favourite memories of us is probably something that looked completely normal and meaningless to everyone else: kissing you on the bike and then immediately acting like nothing happened. Like, yeah, nothing to see here, just two completely normal people who definitely didn't just make a memory that one of them is going to replay in his head for the rest of his life.`,

      `And that's what you do to me. You take ordinary moments and somehow make them stay.`,

      `You know what genuinely surprises me about loving you? It's the way you love. The way you're ready to do anything for your man. Literally anything. And sometimes I sit there and think, bro, how the hell did this girl become mine? Especially because you have your trust issues, I am definitely not the type of boyfriend who does all those perfect boyfriend things you see in movies, and honestly, I can be a lot to handle. Yet somehow, against all odds, you looked at this entire situation and said, "Yes. This one. I'll take him." Absolute madness. But my favourite kind.`,

      `If someone asked me when I'm eighty years old what you were like when you were young, I think I'd say that she was like a kitten with a tiger's personality. Cute enough to make you melt and dangerous enough to make you reconsider your decisions.`,
    ],

    // PAGE 2
    [
      `And I hope you never lose that childish side of you. I hope life never convinces you that you have to become serious all the time, quieter, colder, or less weird. I hope you keep being the girl who can be adorable and chaotic within the same five seconds. And I hope you never lose that helping nature of yours either, the part of you that somehow taught me that even people we don't like can still deserve care.`,

      `There are things I don't say enough. Important things.`,

      `Sometimes I act normal when I actually want to pull you close and tell you that you don't have to be so scared about the future. You don't have to constantly wonder if I'm going to leave. You are in good hands with me. And even if we fight, even if we misunderstand each other, even if things become messy, and let's be honest, we're two idiots, so they definitely will, I don't want you to think that a difficult moment means the end of us.`,

      `You know how people say that after it rains, the clouds disappear? I don't think that's true. I think they just change their position. They never really leave the sky. So maybe that's how I want you to think about us. If we have a fight, I'm not disappearing. If we are distant for a moment, it doesn't mean I'm gone. Sometimes I'll just have to approach you differently. Sometimes you'll have to approach me differently. But love isn't supposed to vanish every time the weather changes.`,

      `And yes, I know I'm not perfect at this. I know there are things you deserve from me more consistently, more reassurance, more patience, more time, more honesty, more attention, and a version of me that's more open about what I actually feel instead of acting like everything is fine or turning something emotional into a joke.`,

      `But loving you has also made me want to become better at those things. Not because you force me to, but because you're worth learning for.`,

      `I love that our plans almost never go exactly as planned. We can plan something, mess it up completely, and somehow still end up okay because the failure of the plan never becomes the failure of us. I love that our relationship isn't some perfectly scripted movie. It's more like two people improvising, occasionally forgetting their lines, sometimes roasting each other, sometimes getting emotional, sometimes flirting way too much, and somehow still choosing to stay in the same scene.`,

      `Our relationship definitely needs a warning label. Warning: Contains emotional damage, random affection, dangerous levels of attraction, suspiciously frequent flirting, two idiots pretending they aren't obsessed with each other, and a very high possibility of one person getting their nipples pinched for absolutely no reason. Honestly, if someone ever read our chats without context, they would need emotional support and probably a glass of water. One moment we are talking about life, insecurities, the future, and how much we care about each other, and the next moment one of us has completely destroyed the emotional atmosphere with something ridiculous enough to make the other person forget what they were even talking about. That chaos is very us, and I wouldn't change a single stupid, flirty, ridiculous part of it.`,

      `If you disappeared from my phone for a week, I think the weirdest thing wouldn't even be some dramatic movie moment. It would be the silence around the small things. Waking up without your good morning text. Going to sleep without your good night. Finding out some random piece of tea and realizing I don't have my favourite person to immediately come and yap about it with.`,

      `Missing you is honestly like opening YouTube knowing exactly what video I want to watch, but the Wi-Fi has personally decided to hate me. Technically, life is still functioning, but something extremely important is not loading.`,
    ],

    // PAGE 3
    [
      `And our future? Oh, I have imagined the stupidest versions of it. Us roasting each other in front of our kids. Pillow fights. Secret kisses at our parents' house like two teenagers who still haven't learned how to behave. Me embarrassing you in a mall by loudly proposing to you just because I think watching your face turn into a mixture of anger, embarrassment, and "I am going to kill you" would be absolutely worth it.`,

      `And yes, I have imagined us married too, still flirting shamelessly, still making out, still finding excuses to disappear into our own little world together, and still being ridiculously attracted to each other even after years of knowing every annoying thing about one another. You once said that after we get married we are going to have a make out session every day, and I would just like the record to show that I have not forgotten that statement. That sentence has been permanently stored in my brain.`,

      `I want all the versions of you. The version laughing uncontrollably. The half-asleep version. The version that talks passionately about something she loves. The version that annoys me. The angry version that I secretly find cute. The vulnerable version that trusts me enough to let me see her heart. The confident version that knows exactly who she is. The childish version. The kind version. Even the annoying nipple-pinching terrorist version.`,

      `I don't want to freeze you into one perfect version of yourself. I want to remember that you were always a whole universe of different versions, and somehow, I fell in love with all of them.`,

      `I love the sweet version of you, the chaotic version, the vulnerable version, and yes, the dangerously attractive version of you that knows exactly how to drive me insane with a look or a smile that makes my brain immediately stop behaving. One second I am a normal functioning human being, and the next second my thoughts have gone from "I should probably finish this work" to "I need to see my girlfriend immediately." You have absolutely no idea how powerful you are sometimes, and honestly, maybe it is better that you do not, because I already have enough trouble surviving your confidence as it is.`,

      `And maybe that's the strangest truth about loving you. It's not always some giant, cinematic feeling. Sometimes it's remembering you when it rains. Sometimes it's replaying a kiss on a bike. Sometimes it's laughing about the stupid things you do. Sometimes it's worrying about losing the little pieces of you that have quietly become part of my everyday life. Sometimes it's just seeing your name appear on my phone and feeling like the day suddenly has better Wi-Fi.`,

      `And sometimes, when I really think about it, it's terrifying how naturally you became important to me. You didn't arrive with some dramatic announcement. You just slowly entered my days, then my routines, then my thoughts, then my future. And somewhere along the way, without asking for permission, you became someone whose happiness matters to me in a way I can't pretend is casual.`,

      `So on your birthday, I don't just want to tell you that you're beautiful or that I love you. I want to tell you that you are loved in all the weird little places too. In the rain, in random memories, in stupid jokes, in failed plans, in silence, in arguments, in late-night thoughts, and in the moments where I don't know how to say what I actually feel.`,
    ],

    // PAGE 4
    [
      `And yes, sometimes my brain wanders into thoughts that definitely cannot be read aloud at a family function. Sometimes they are thoughts about kissing you. Sometimes about making out with you until we both forget what time it is. Sometimes my brain remembers something about you and immediately decides that productivity is cancelled because apparently thinking about my girlfriend is more important than whatever useful thing I was supposed to be doing. You have an unreasonable amount of power over my concentration.`,

      `And I know you like the raw truth, so here it is. You are not just someone I love emotionally. I desire you too. I think you're hot. I love that with you I do not have to pretend that romance and attraction are two separate things. I can want to hold you close, listen to your problems, reassure you when you are insecure, kiss you until you smile, and also get completely distracted by how beautiful you are, all because you are somehow the same person to me. My girlfriend, my favourite person, my comfort, and unfortunately for my self-control, one of the biggest reasons my brain refuses to behave.`,

      `But beyond all the flirting, teasing, roasting, making each other angry for no reason, acting like idiots, and pretending we're not ridiculously attached to each other, I hope you know this. You don't have to become someone else to be loved by me. You don't have to stop being childish. You don't have to be perfect. You don't have to have everything figured out. You can be angry, annoying, sleepy, dramatic, vulnerable, confident, chaotic, soft, loud, confused, and completely yourself, and I will still look at you and think, "Yep. That's my kitten with a tiger's personality."`,

      `Happy Birthday, baby. Thank you for being the girl who somehow manages to be cute, crazy, caring, annoying, insanely attractive, emotionally dangerous, childish, capable of making me lose my mind at completely unreasonable times, and impossible to replace, all at the same time.`,

      `I hope this year gives you reasons to laugh until your stomach hurts, confidence when your mind tries to make you doubt yourself, peace when life becomes too loud, and memories so good that one day we'll look back on them and say, "Damn, we were actually insane." And if we're lucky, maybe we'll still be insane together when we're eighty. Just older, wrinklier, still roasting each other, still secretly kissing when we think nobody is looking, still failing to follow our plans, still making new ones, and still changing positions like clouds when the weather gets rough, but never really leaving the same sky.`,

      `Happy Birthday, my love. ❤️`,

      `Now please enjoy your birthday peacefully. And maybe, just maybe, keep your hands away from my nipples for at least five minutes. Although knowing you, that request is probably more unrealistic than our plans actually working out.`,

      `Happy birthday, baby. Keep being my cute little kitten with a tiger's personality, keep making me laugh, keep making me lose my mind, and keep being the girl I want to kiss when I see her, flirt with when I miss her, and hold close whenever life gets loud.`,

      `I love you, I choose you, and I am still completely fascinated by the fact that out of everyone in this world, I somehow got to call this beautiful, chaotic little menace mine. You are cute enough to make me want to protect you, annoying enough to make me want to fight you with a pillow, beautiful enough to make me stare at you like an idiot, and attractive enough to make my thoughts take a very inappropriate turn at the most inconvenient times. Basically, you are a complete problem, and I am completely happy that you are my problem.`,

      `So happy birthday to my favourite girl, my kitten with a tiger's personality, my personal distraction, my emotional support menace, the reason I smile at my phone like an idiot, and the one person who somehow managed to make love feel safe, funny, chaotic, romantic, and completely worth it all at once. I hope this birthday reminds you how loved you are, how wanted you are, and how unbelievably lucky I feel that I get to be the guy who calls you mine. ❤️`,
    ],
  ]

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        paddingBottom: '96px',
      }}
    >
      {/* Huge Royal Flower Petals & Heart Blast Canvas */}
      {triggerRoyalBlast && (
        <PetalBlastCanvas
          origin="center-radiating"
          density={300}
          onComplete={() =>
            setTriggerRoyalBlast(false)
          }
        />
      )}

      {/* Hero Section */}
      <section
        style={{
          width: '100%',
          height: 'calc(100vh - 72px)',
          minHeight: '620px',
          background:
            'linear-gradient(135deg, #FBEFE1 0%, #F5E4D2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 1.5%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '97vw',
            maxWidth: '1520px',
            height: '95%',
            maxHeight: '860px',
            minHeight: '540px',
            position: 'relative',
            borderRadius: '40px',
            overflow: 'hidden',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            boxShadow:
              '0 20px 50px rgba(61, 26, 40, 0.12), 0 0 25px rgba(251, 239, 225, 0.6)',
            border:
              '1.5px solid rgba(216, 59, 86, 0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(251, 239, 225, 0.05) 0%, transparent 60%, rgba(61, 26, 40, 0.35) 100%)',
              pointerEvents: 'none',
            }}
          />

          <label
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              padding: '10px 20px',
              borderRadius: '9999px',
              background:
                'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#3D1A28',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.12)',
              border:
                '1px solid rgba(255, 206, 227, 0.8)',
              zIndex: 10,
            }}
          >
            Change Photo

            <input
              type="file"
              accept="image/*"
              onChange={handleHeroUpload}
              style={{ display: 'none' }}
            />
          </label>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            onClick={() =>
              window.scrollTo({
                top: window.innerHeight - 72,
                behavior: 'smooth',
              })
            }
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 24px',
              borderRadius: '9999px',
              background:
                'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#D83B56',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.12)',
              border:
                '1px solid rgba(255, 206, 227, 0.8)',
              zIndex: 10,
            }}
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* Main Stack Content */}
      <div
        style={{
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '48px 24px 0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Birthday Surprise Candle Section */}
        <div
          style={{
            width: '100%',
            borderRadius: '32px',
            background:
              'linear-gradient(135deg, #FFF2EB 0%, #FFE4EF 100%)',
            border: '1px solid #FFCEE3',
            padding: '32px',
            textAlign: 'center',
            boxShadow:
              '0 12px 32px rgba(61, 26, 40, 0.08)',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#F75270',
              textTransform: 'uppercase',
            }}
          >
            Birthday Celebration
          </span>

          {!candlesBlown ? (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                onMouseDown={() =>
                  setCandleHoldProgress(5)
                }
                onMouseUp={() =>
                  setCandleHoldProgress(0)
                }
                onTouchStart={() =>
                  setCandleHoldProgress(5)
                }
                onTouchEnd={() =>
                  setCandleHoldProgress(0)
                }
                style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transform: `scale(${
                    1 + candleHoldProgress * 0.003
                  })`,
                  userSelect: 'none',
                }}
              >
                {[0, 1, 2].map((candle) => (
                  <div
                    key={candle}
                    style={{
                      width: '12px',
                      height: '40px',
                      background: '#FFD700',
                      borderRadius: '4px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '2px',
                        width: '8px',
                        height: '14px',
                        background: '#FF7F50',
                        borderRadius:
                          '50% 50% 20% 20%',
                      }}
                    />
                  </div>
                ))}
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: '#888',
                  fontStyle: 'italic',
                }}
              >
                Press and hold to blow out the
                candles... ({candleHoldProgress}%)
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '28px',
                  color: '#3D1A28',
                }}
              >
                "Happy Birthday, my love"
              </h3>

              {priorWish && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: '#FFF',
                    border: '1px solid #FFCEE3',
                    fontFamily:
                      'var(--font-handwriting)',
                    fontSize: '18px',
                    color: '#D83B56',
                  }}
                >
                  Last year, your partner wished:
                  "{priorWish}"
                </div>
              )}

              <form
                onSubmit={handleWishSubmit}
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <textarea
                  value={wishInput}
                  onChange={(e) =>
                    setWishInput(e.target.value)
                  }
                  placeholder="Make a secret wish for next year..."
                  rows={2}
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px solid #FFCEE3',
                    fontFamily:
                      'var(--font-handwriting)',
                    fontSize: '18px',
                    outline: 'none',
                  }}
                />

                {wishError && (
                  <p
                    style={{
                      color: '#D83B56',
                      fontSize: '12px',
                    }}
                  >
                    {wishError}
                  </p>
                )}

                {wishSubmitted ? (
                  <p
                    style={{
                      color: '#F75270',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Your wish is saved for next year
                  </p>
                ) : (
                  <button
                    className="lux-button"
                    type="submit"
                  >
                    Make a Wish
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </div>

        {/* Nickname Greeting Banner */}
        <AnimatePresence>
          {showGreeting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass"
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                fontFamily:
                  'var(--font-handwriting)',
                fontSize: '22px',
                color: '#D83B56',
                border: '1px solid #FFCEE3',
              }}
            >
              Welcome back, {nickname}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Now Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
        >
          <div
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '24px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.7,
              }}
            >
              Days Together
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '36px',
                color: '#D83B56',
                margin: '4px 0',
              }}
            >
              {daysTogether}
            </h2>

            <span
              style={{
                fontSize: '12px',
                opacity: 0.8,
              }}
            >
              and counting every second
            </span>
          </div>

          <div
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.7,
                marginBottom: '6px',
              }}
            >
              Today's Thought
            </span>

            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '15px',
                color: '#3D1A28',
              }}
            >
              "{todaySentence}"
            </p>
          </div>

          <div
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '24px',
              textAlign: 'center',
              border:
                '1px solid rgba(255, 206, 227, 0.5)',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.7,
              }}
            >
              Love Note
            </span>

            <p
              style={{
                fontFamily:
                  'var(--font-handwriting)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#D83B56',
                marginTop: '8px',
              }}
            >
              Every meet with you becomes my
              favorite memory
            </p>
          </div>
        </div>

        {/* ULTRA-ROYAL 4 PAGE BIRTHDAY LETTER SECTION */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            borderRadius: '36px',
            background:
              'linear-gradient(135deg, #FCF5EE 0%, #F5E4D2 100%)',
            border: '2px solid #D4AF37',
            boxShadow:
              '0 25px 70px rgba(212, 175, 55, 0.25), 0 10px 30px rgba(61, 26, 40, 0.15)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Gold Corner Accents */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              color: '#D4AF37',
              fontSize: '16px',
            }}
          >
            ✦
          </div>

          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              color: '#D4AF37',
              fontSize: '16px',
            }}
          >
            ✦
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              color: '#D4AF37',
              fontSize: '16px',
            }}
          >
            ✦
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              color: '#D4AF37',
              fontSize: '16px',
            }}
          >
            ✦
          </div>

          {/* Letter Crown Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '30px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: '#D4AF37',
                textTransform: 'uppercase',
              }}
            >
              ROYAL DEDICATION
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '38px',
                color: '#3D1A28',
                marginTop: '8px',
                marginBottom: '8px',
              }}
            >
              To My Most Precious Girlfriend
            </h2>

            <div
              style={{
                width: '100px',
                height: '2px',
                background:
                  'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                margin: '14px auto 0',
              }}
            />
          </div>

          {/* Sealed State */}
          {isLetterSealed ? (
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleUnsealRoyalLetter}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '18px',
                cursor: 'pointer',
                padding: '50px 0',
              }}
            >
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, #D4AF37 0%, #8A6200 100%)',
                  boxShadow:
                    '0 10px 30px rgba(212,175,55,0.5), 0 0 25px rgba(255,215,0,0.5)',
                  border: '3px solid #FFF8E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: '#FFF',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                }}
              >
                S&M
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '20px',
                  color: '#3D1A28',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Tap the Royal Wax Seal
                <br />
                to Open Your Letter ❤️
              </span>
            </motion.div>
          ) : (
            <div
              style={{
                width: '100%',
                maxWidth: '760px',
              }}
            >
              {/* Page Indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                {pageNumbers.map(
                  (number, index) => (
                    <button
                      key={number}
                      onClick={() =>
                        setLetterPage(index)
                      }
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        border:
                          index === letterPage
                            ? '1px solid #D4AF37'
                            : '1px solid rgba(212,175,55,0.35)',
                        background:
                          index === letterPage
                            ? 'linear-gradient(135deg, #E8C45B, #B88916)'
                            : 'rgba(255,255,255,0.55)',
                        color:
                          index === letterPage
                            ? '#FFFFFF'
                            : '#8A6A20',
                        fontFamily:
                          'var(--font-serif)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow:
                          index === letterPage
                            ? '0 6px 18px rgba(212,175,55,0.35)'
                            : 'none',
                        transition:
                          'all 0.3s ease',
                      }}
                    >
                      {number}
                    </button>
                  ),
                )}
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '28px',
                }}
              >
                <span
                  style={{
                    color: '#A77B16',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  Page {letterPage + 1} of 4
                </span>
              </div>

              {/* Animated Page Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={letterPage}
                  initial={{
                    opacity: 0,
                    x: 45,
                    rotateY: 4,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -45,
                    rotateY: -4,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: 'easeInOut',
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    minHeight: '520px',
                  }}
                >
                  {letterPages[letterPage].map(
                    (paragraph, index) => (
                      <p
                        key={`${letterPage}-${index}`}
                        style={{
                          fontFamily:
                            'var(--font-serif)',
                          fontSize: '18px',
                          lineHeight: '1.85',
                          color: '#3D1A28',
                          margin: 0,
                          textIndent:
                            index === 0 &&
                            letterPage === 0
                              ? '0'
                              : '28px',
                        }}
                      >
                        {paragraph}
                      </p>
                    ),
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Royal Navigation */}
              <div
                style={{
                  marginTop: '42px',
                  paddingTop: '24px',
                  borderTop:
                    '1px solid rgba(212,175,55,0.35)',
                  display: 'flex',
                  justifyContent:
                    letterPage === 0
                      ? 'flex-end'
                      : 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {letterPage > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={goToPreviousPage}
                    style={{
                      border: '1px solid #C9A23B',
                      background:
                        'rgba(255,255,255,0.65)',
                      color: '#6F5313',
                      padding: '13px 24px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      fontFamily:
                        'var(--font-serif)',
                      fontSize: '15px',
                      fontWeight: 700,
                      boxShadow:
                        '0 6px 18px rgba(61,26,40,0.08)',
                    }}
                  >
                    ← Previous Page
                  </motion.button>
                )}

                {letterPage < 3 ? (
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow:
                        '0 12px 28px rgba(139,98,0,0.35)',
                    }}
                    whileTap={{ scale: 0.96 }}
                    onClick={goToNextPage}
                    style={{
                      border: 'none',
                      background:
                        'linear-gradient(135deg, #E6C45D 0%, #B47B09 100%)',
                      color: '#FFFFFF',
                      padding: '14px 28px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      fontFamily:
                        'var(--font-serif)',
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow:
                        '0 10px 24px rgba(180,123,9,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    Next Page
                    <span
                      style={{
                        fontSize: '19px',
                      }}
                    >
                      →
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={restartLetter}
                    style={{
                      border: 'none',
                      background:
                        'linear-gradient(135deg, #D83B56 0%, #8F2037 100%)',
                      color: '#FFFFFF',
                      padding: '14px 28px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      fontFamily:
                        'var(--font-serif)',
                      fontSize: '16px',
                      fontWeight: 700,
                      boxShadow:
                        '0 10px 24px rgba(143,32,55,0.3)',
                    }}
                  >
                    Read Our Story Again ❤️
                  </motion.button>
                )}
              </div>

              {/* Final Signature */}
              {letterPage === 3 && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.25,
                  }}
                  style={{
                    textAlign: 'right',
                    marginTop: '34px',
                    paddingTop: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily:
                        'var(--font-handwriting)',
                      fontSize: '30px',
                      color: '#B88916',
                      margin: 0,
                    }}
                  >
                    Forever, ridiculously,
                    and shamelessly yours ❤️
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* SoundOfUsCard */}
        <SoundOfUsCard variant="featured" />

        {/* Hill Divider */}
        <HillDivider />

        {/* Today's Surprise Slot */}
        {(() => {
          const compliments = [
            "You're the reason I believe in magic",
            "If kisses were snowflakes, I'd send you a blizzard",
            'Your smile is my favorite notification',
            'I fall in love with you a little more every single day',
            'You make ordinary moments feel extraordinary',
            'My heart does a little dance every time I think of you',
            "You're not just my love, you're my favorite adventure",
          ]

          const todayCompliment =
            compliments[
              dayOfYear % compliments.length
            ]

          return (
            <div
              className="glass"
              onClick={() => {
                setSurpriseRevealed(true)

                void persistState(
                  'surpriseRevealed',
                  true,
                )
              }}
              style={{
                width: '100%',
                maxWidth: '480px',
                borderRadius: '24px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition:
                  'transform 0.2s ease',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#F75270',
                  fontWeight: 700,
                }}
              >
                TODAY'S SURPRISE
              </span>

              {surpriseRevealed ? (
                <motion.p
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  style={{
                    fontFamily:
                      'var(--font-handwriting)',
                    fontSize: '22px',
                    color: '#D83B56',
                    marginTop: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {todayCompliment}
                </motion.p>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily:
                        'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: '18px',
                      color: '#3D1A28',
                      marginTop: '12px',
                    }}
                  >
                    "What has two hearts and endless
                    memories?"
                  </p>

                  <span
                    style={{
                      fontSize: '13px',
                      color: '#F75270',
                      display: 'block',
                      marginTop: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Tap to reveal
                  </span>
                </>
              )}
            </div>
          )
        })()}

        {/* Quiet Closing Line */}
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily:
                'var(--font-handwriting)',
              fontSize: '24px',
              color: '#3D1A28',
            }}
          >
            still choosing you, on repeat
          </p>
        </div>
      </div>
    </div>
  )
}