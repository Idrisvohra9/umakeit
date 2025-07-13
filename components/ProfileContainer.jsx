"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Matter from "matter-js";
import Modal from "./Modal";
import { Github } from "lucide-react";

/**
 * ProfileContainer Component
 *
 * A high-performance physics-based GitHub profile animation component that automatically
 * triggers on scroll. Uses Matter.js for realistic physics simulation of profile
 * elements that react to user interaction and scroll events.
 *
 * Features:
 * - Automatic scroll-based triggering
 * - Optimized animation loop with 60 FPS cap
 * - Throttled scroll event handling
 * - Responsive design with resize handling
 * - Memoized configurations for better performance
 * - GitHub profile management with modal interface
 */
const ProfileContainer = ({
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 0.56,
  mouseConstraintStiffness = 0.9,
}) => {
  const containerRef = useRef(null);
  const profilesRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const [effectStarted, setEffectStarted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      name: "Linus Torvalds",
      profileUrl: "https://github.com/torvalds",
      avatarUrl: "https://github.com/torvalds.png",
    },
    {
      id: 2,
      name: "Dan Abramov",
      profileUrl: "https://github.com/gaearon",
      avatarUrl: "https://github.com/gaearon.png",
    },
    {
      id: 3,
      name: "Evan You",
      profileUrl: "https://github.com/yyx990803",
      avatarUrl: "https://github.com/yyx990803.png",
    },
  ]);
  const [formData, setFormData] = useState({
    username: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form submission to add a new profile
  const handleAddProfile = useCallback(
    async (e) => {
      e.preventDefault();
      
      if (!formData.username.trim()) {
        setError("Please enter a GitHub username");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // Fetch GitHub profile data
        const username = formData.username.trim();
        const response = await fetch(`https://api.github.com/users/${username}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("GitHub user not found");
          }
          throw new Error("Failed to fetch profile data");
        }

        const githubProfile = await response.json();

        const newProfile = {
          id: Date.now(),
          name: githubProfile.name || githubProfile.login, // Use display name or fallback to username
          profileUrl: githubProfile.html_url,
          avatarUrl: githubProfile.avatar_url,
          username: githubProfile.login,
        };

        setProfiles((prevProfiles) => [...prevProfiles, newProfile]);
        setFormData({ username: "" });
        setIsModalOpen(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [formData]
  );

  // Handle form input changes
  const handleInputChange = useCallback((value) => {
    setFormData({ username: value });
    if (error) setError(""); // Clear error when user types
  }, [error]);

  // Memoize the profile elements generation for better performance
  const renderProfiles = useCallback(() => {
    if (!profilesRef.current) return;

    profilesRef.current.innerHTML = "";

    profiles.forEach((profile) => {
      const profileDiv = document.createElement("div");
      profileDiv.className = "inline-block mx-2 my-2 select-none profile-item";
      profileDiv.setAttribute("data-profile-id", profile.id);

      profileDiv.innerHTML = `
        <div class="flex items-center gap-3">
          <img
            src="${profile.avatarUrl}"
            alt="${profile.name}"
            class="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
            onerror="this.src='https://github.com/github.png'"
          />
          <div class="flex flex-col flex-1">
            <span class="text-white font-semibold">${profile.name}</span>
            
          </div>
        </div>
      `;

      profilesRef.current.appendChild(profileDiv);
    });
  }, [profiles]);

  useEffect(() => {
    renderProfiles();
  }, [renderProfiles]);

  // Throttled scroll handler for performance
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (isInViewport) {
      setEffectStarted(true);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  }, []);

  // Throttled scroll event listener
  useEffect(() => {
    let ticking = false;

    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScrollHandler, {
      passive: true,
    });
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScrollHandler);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Handle window resize for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (effectStarted && containerRef.current) {
        // Reset effect on resize to recalculate dimensions
        setEffectStarted(false);
        setTimeout(() => setEffectStarted(true), 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [effectStarted]);

  useEffect(() => {
    if (!effectStarted) return;

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } =
      Matter;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    if (width <= 0 || height <= 0) return;

    // Create engine with maximum collision stability
    const engine = Engine.create();
    engine.gravity.y = gravity;
    // engine.timing.timeScale = 0.8; // Slow down time slightly for better collision detection

    // // Maximum collision detection settings to prevent phasing
    // engine.positionIterations = 12; // Increase significantly from default 6
    // engine.velocityIterations = 10; // Increase significantly from default 4
    // engine.constraintIterations = 6; // Increase significantly from default 2

    // // Enable continuous collision detection
    // engine.enableSleeping = false; // Keep all bodies active for better collision detection

    // Create renderer with optimized settings
    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes,
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Limit pixel ratio for performance
        hasBounds: true,
      },
    });
    renderRef.current = render;

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };
    const floor = Bodies.rectangle(
      width / 2,
      height,
      width,
      50,
      boundaryOptions
    );
    const leftWall = Bodies.rectangle(
      -25,
      height / 2,
      50,
      height,
      boundaryOptions
    );
    const rightWall = Bodies.rectangle(
      width,
      height / 2,
      50,
      height,
      boundaryOptions
    );
    const ceiling = Bodies.rectangle(
      width / 2,
      -25,
      width,
      50,
      boundaryOptions
    );

    const wordSpans = profilesRef.current.querySelectorAll(".profile-item");
    const wordBodies = [...wordSpans].map((elem) => {
      const rect = elem.getBoundingClientRect();

      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: "transparent" },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2,
      });

      // Add gentle initial velocity to prevent clustering
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2, // Reduced from 5 to 2
        y: 0,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02); // Reduced from 0.05

      return { elem, body };
    });

    // Set initial positions
    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute";
      elem.style.left = `${
        body.position.x - body.bounds.max.x + body.bounds.min.x / 2
      }px`;
      elem.style.top = `${
        body.position.y - body.bounds.max.y + body.bounds.min.y / 2
      }px`;
      elem.style.transform = "none";
    });

    const mouse = Mouse.create(containerRef.current);

    // Enable page scrolling by allowing mouse wheel events to bubble up
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    render.mouse = mouse;

    // Remove the extra mouse event handling since we're using the original mouse setup
    // The mouse constraint will handle all interactions automatically

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Matter.Engine.update(engine);
      requestAnimationFrame(updateLoop);
    };
    updateLoop();

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.removeChild(render.canvas);
      }
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, [
    effectStarted,
    gravity,
    wireframes,
    backgroundColor,
    mouseConstraintStiffness,
    profiles,
  ]);

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (animationFrameRef.current) {
  //       cancelAnimationFrame(animationFrameRef.current);
  //     }
  //     if (scrollTimeoutRef.current) {
  //       clearTimeout(scrollTimeoutRef.current);
  //     }
  //   };
  // }, []);

  // Handle window resize for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (effectStarted && containerRef.current) {
        // Reset effect on resize to recalculate dimensions
        setEffectStarted(false);
        setTimeout(() => setEffectStarted(true), 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [effectStarted]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-[1] mx-auto max-w-3xl h-screen text-center pt-4 pb-8 px-4 rounded-2xl border border-gray-700 shadow-lg overflow-hidden"
      >
        {/* Add Profile Button */}
        <div className="mb-6 absolute top-4 right-4">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError("");
              setFormData({ username: "" });
            }}
            className="text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 relative z-10 cursor-pointer"
          >
            Add Your Profile <Github className="inline-block ml-2" />
          </button>
        </div>
        <div className="inset-0 z-[-1] w-full h-full absolute flex items-center justify-center text-gray-600">
          <h2 className="text-4xl font-black text-center">
            Contributors
          </h2>
        </div>
        {/* Profiles Container */}
        <div ref={profilesRef} className="block min-h-[800px]" />

        {/* Show message when no profiles */}
        {profiles.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg">No profiles added yet!</p>
            <p className="text-sm mt-2">
              Click "Add Your Profile" to get started
            </p>
          </div>
        )}

        {/* Canvas Container for Physics */}
        <div className="absolute top-0 left-0 z-0" ref={canvasContainerRef} />
      </div>

      {/* Modal for Adding Profile */}
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setError("");
        setFormData({ username: "" });
      }}>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Add GitHub Profile
          </h2>

          <form onSubmit={handleAddProfile} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                GitHub Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter GitHub username (e.g., torvalds)"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                We'll automatically fetch the profile name and photo from GitHub
              </p>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                  setFormData({ username: "" });
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fetching...
                  </div>
                ) : (
                  "Add Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default ProfileContainer;
