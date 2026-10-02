
        </defs>

        <g className="gs-global-route-layer">
          {routes.map((route, routeIndex) => {
            const d = routePath(route);

            return (
              <g key={route.id}>
                <path
                  d={d}
                  pathLength={1}
                  className="gs-global-route gs-global-route-shadow"
                  style={{
                    animationDelay: `${routeIndex * 0.06}s`
                  }}
                />
                <path
                  d={d}
                  pathLength={1}
                  className="gs-global-route gs-global-route-main"
                  style={{
                    animationDelay: `${routeIndex * 0.06}s`
                  }}
                />

                {route.particle && (
                  <circle
                    r="3.25"
                    className="gs-route-particle"
                  >
                    <animateMotion
                      dur={`${route.duration}s`}
                      begin={`${route.delay}s`}
                      repeatCount="indefinite"
                      path={d}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="spline"
                      keySplines=".42 0 .2 1"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        <g className="gs-global-pin-layer">
          {points.map((point, index) => (
            <g
              key={point.id}
              transform={`translate(${point.x} ${point.y})`}
              className={
                "gs-global-pin " +
                (point.primary ? "gs-global-pin-primary" : "")
              }
              style={{
                animationDelay: `${0.18 + index * 0.1}s`
              }}
            >
              <circle
                r={point.primary ? 27 : 22}
                className="gs-global-pin-halo"
              />

              <g>
                <path
                  d="M 0 -20 C -12 -20 -21 -11 -21 1 C -21 16 0 33 0 33 C 0 33 21 16 21 1 C 21 -11 12 -20 0 -20 Z"
                  fill="url(#gs-pin-core)"
                  stroke="rgba(255,255,255,.75)"
                  strokeWidth="2"
                />
                <circle r="7.2" fill="rgba(255,255,255,.96)" />
                <circle r="3.2" fill="#8F0000" />
              </g>

              <g
                transform="translate(0 45)"
                className="gs-global-pin-label"
              >
                <rect
                  x="-18"
                  y="-10"
                  width="36"
                  height="20"
                  rx="10"
                  fill="rgba(0,0,0,.58)"
                  stroke="rgba(255,255,255,.14)"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  letterSpacing="1.4"
                  fill="rgba(255,255,255,.88)"
                >
                  {point.label}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
