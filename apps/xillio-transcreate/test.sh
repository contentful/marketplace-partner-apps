npx playwright install --with-deps
npx storybook build
npx concurrently -k -s first -n "SB,TEST" -c "magenta,blue" "npx http-server storybook-static --port 6006 --silent" "npx wait-on tcp:6006 && npm run test:storybook"
