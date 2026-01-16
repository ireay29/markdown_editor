FROM python:3.10-slim AS base

# Define custom function directory
ARG FUNCTION_DIR="/var/task"
WORKDIR ${FUNCTION_DIR}

# Include global arg in this stage of the build
ARG FUNCTION_DIR
ENV POETRY_VERSION=1.4.2

RUN apt-get update && apt-get install -y \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy function code
RUN mkdir function
COPY . ${FUNCTION_DIR}

RUN cd ${FUNCTION_DIR}

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION" \
&& poetry export -f requirements.txt -o requirements.txt --without-hashes \
&& pip install --no-cache-dir -r requirements.txt


COPY install.py /tmp

RUN python /tmp/install.py

# Use a slim version of the base Python image to reduce the final image size
FROM base AS prod

# Include global arg in this stage of the build
ARG FUNCTION_DIR
# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

# Copy in the built dependencies
COPY --from=base ${FUNCTION_DIR} ${FUNCTION_DIR}
ENV PLAYWRIGHT_BROWSERS_PATH=/playwright
RUN playwright install --with-deps chromium

# Set runtime interface client as default command for the container runtime
ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]
# Pass the name of the function handler as an argument to the runtime
CMD [ "lambda_function.handler" ]
